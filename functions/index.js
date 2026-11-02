const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const axios = require("axios");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// بيانات UltraMsg (من لوحة تحكم UltraMsg)
const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || "instanceXXXXX";
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN || "your_token_here";

/**
 * دالة تفحص حالة الشحنة عبر كود التتبع
 * (يمكن ربطها بـ API Yurtiçi Kargo أو خدمة وسيطة مثل Ship24/TrackingMore)
 */
async function checkCargoDeliveryStatus(trackingNumber, company) {
  try {
    /* 
      مثال عملي باستخدام خدمة تتبع (مثل Ship24 أو TrackingMore):
      const res = await axios.get(`https://api.trackingmore.com/v4/trackings/get?tracking_numbers=${trackingNumber}`, {
        headers: { 'Tracking-Api-Key': 'YOUR_API_KEY' }
      });
      return res.data.data[0].delivery_status === 'delivered';
    */

    return false; 
  } catch (err) {
    console.error(`خطأ أثناء فحص الشحنة ${trackingNumber}:`, err.message);
    return false;
  }
}

/**
 * دالة إرسال رسالة الواتساب عبر UltraMsg
 */
async function sendDeliveryWhatsApp(phone, customerName, invoiceId, trackingNumber) {
  let cleanPhone = phone.replace(/[^0-9]/g, "");
  if (cleanPhone.startsWith("05")) {
    cleanPhone = "90" + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith("5")) {
    cleanPhone = "90" + cleanPhone;
  }

  const messageBody = `السلام عليكم ورحمة الله وبركاته،
أهلاً بك أخي الكريم / أختي الكريمة *${customerName}* 🌿

يسرّنا إعلامك بأنه تم تسليم شحنتك بنجاح من مناحلنا 🍯📦
(فاتورة رقم: #${invoiceId} | بوليصة الشحن: ${trackingNumber})

نتمنى أن تنال منتجاتنا الطبيعية كامل رضاكم وإعجابكم، وبالهناء والعافية دائماً.
نسعد دائماً بخدمتكم وتواصلكم معنا بأي وقت! ✨`;

  return axios.post(
    `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`,
    new URLSearchParams({
      token: ULTRAMSG_TOKEN,
      to: cleanPhone,
      body: messageBody,
    }).toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );
}

/**
 * 1. الدالة الفورية عند تحديث مستند الشحنة
 */
exports.onShipmentStatusChanged = onDocumentUpdated("shipments/{shipmentId}", async (event) => {
  if (!event.data) return null;
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();

  if (
    beforeData &&
    afterData &&
    beforeData.status !== "تم التسليم" &&
    afterData.status === "تم التسليم" &&
    !afterData.deliveryNotificationSent
  ) {
    let phone = afterData.customerPhone || "";
    const customerName = afterData.customerName || "عميلنا العزيز";
    const invoiceId = afterData.invoiceId || "";
    const trackingNumber = afterData.trackingNumber || "";

    try {
      const response = await sendDeliveryWhatsApp(phone, customerName, invoiceId, trackingNumber);
      console.log("تم إرسال رسالة واتساب بنجاح:", response.data);

      return event.data.after.ref.update({
        deliveryNotificationSent: true,
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("فشل إرسال رسالة واتساب:", error.response ? error.response.data : error.message);
    }
  }

  return null;
});

// 2. الدالة المجدولة: تعمل كل 3 ساعات لفحص حالة الشحنات تلقائياً عبر Cron
// cron syntax: "0 */3 * * *" تعني: كل 3 ساعات عند الدقيقة 0
exports.checkShipmentsStatusSchedule = onSchedule(
  {
    schedule: "0 */3 * * *",
    timeZone: "Europe/Istanbul",
  },
  async (event) => {
    console.log("بدء الفحص الدوري للشحنات النشطة...");

    // جلب الشحنات التي لم يتم تسليمها بعد
    const snapshot = await db.collection("shipments")
      .where("status", "==", "تم الشحن")
      .where("deliveryNotificationSent", "==", false)
      .get();

    if (snapshot.empty) {
      console.log("لا توجد شحنات معلقة تحتاج إلى فحص.");
      return;
    }

    console.log(`تم العثور على ${snapshot.size} شحنة قيد المتابعة.`);

    for (const doc of snapshot.docs) {
      const shipment = doc.data();
      const trackingNumber = shipment.trackingNumber;

      if (!trackingNumber) continue;

      // التحقق من موقع/خدمة الشحن هل تم التسليم
      const isDelivered = await checkCargoDeliveryStatus(
        trackingNumber,
        shipment.cargoCompany
      );

      if (isDelivered) {
        console.log(`الشحنة ${trackingNumber} تم تسليمها، جاري إرسال الإشعار...`);

        try {
          await sendDeliveryWhatsApp(
            shipment.customerPhone,
            shipment.customerName,
            shipment.invoiceId,
            trackingNumber
          );

          await doc.ref.update({
            status: "تم التسليم",
            deliveryNotificationSent: true,
            deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`تم تحديث الشحنة #${doc.id} وإشعار العميل بنجاح.`);
        } catch (sendErr) {
          console.error(`فشل إرسال الإشعار للشحنة ${trackingNumber}:`, sendErr.message);
        }
      }
    }
  }
);

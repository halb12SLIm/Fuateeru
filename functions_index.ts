/**
 * Firebase Cloud Function (Node.js / TypeScript)
 * يتم تفعيلها تلقائياً عند تغيير حالة الشحنة في Cloud Firestore إلى "تم التسليم"
 * وتقوم بإرسال رسالة واتساب للزبون مباشرة عبر UltraMsg API
 */

/* 
// تثبيت المكتبات المطلوبة في مجلد Cloud Functions:
// npm install firebase-admin firebase-functions axios

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();

// إعدادات بوابة UltraMsg (يمكن ضبطها في متغيرات البيئة)
const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || 'instance12345';
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN || 'your_ultramsg_token';

export const onShipmentStatusUpdated = functions.firestore
  .document('shipments/{shipmentId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // التحقق من أن حالة الشحنة تغيرت حديثاً إلى "تم التسليم"
    if (beforeData.status !== 'تم التسليم' && afterData.status === 'تم التسليم') {
      const customerName = afterData.customerName || 'الزبون الكريم';
      let phone = afterData.customerPhone || '';
      const invoiceId = afterData.invoiceId || '';
      const trackingNumber = afterData.trackingNumber || '';

      // تنظيف رقم الهاتف وإعداده بالصيغة الدولية
      phone = phone.replace(/[^0-9]/g, '');
      if (phone.startsWith('05')) {
        phone = '90' + phone.substring(1);
      } else if (phone.startsWith('5')) {
        phone = '90' + phone;
      }

      if (!phone) {
        console.log('رقم الهاتف غير متوفر للشحنة:', context.params.shipmentId);
        return null;
      }

      // صياغة رسالة التسليم والتهنئة
      const message = `السلام عليكم ورحمة الله وبركاته،\n` +
        `أهلاً بك أخي الكريم / أختي الكريمة *${customerName}* 🌿\n\n` +
        `يسرّنا إعلامك بأنه تم تسليم شحنتك بنجاح من مناحلنا 🍯📦\n` +
        `(فاتورة رقم: #${invoiceId} | بوليصة الشحن: ${trackingNumber})\n\n` +
        `نتمنى أن تنال منتجاتنا الطبيعية كامل رضاكم وإعجابكم، وبالهناء والعافية دائماً.\n` +
        `نسعد دائماً بخدمتكم وتواصلكم معنا بأي وقت! ✨`;

      try {
        // إرسال الطلب عبر UltraMsg API
        const response = await axios.post(
          `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`,
          new URLSearchParams({
            token: ULTRAMSG_TOKEN,
            to: phone,
            body: message,
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        console.log('تم إرسال إشعار الواتساب بنجاح عبر UltraMsg:', response.data);
        return response.data;
      } catch (error) {
        console.error('خطأ أثناء الإرسال عبر UltraMsg API:', error);
        throw error;
      }
    }

    return null;
  });
*/

export function generateDeliveryMessage({
  customerName,
  invoiceId,
  trackingNumber,
}: {
  customerName: string;
  invoiceId: string;
  trackingNumber: string;
}): string {
  return `السلام عليكم ورحمة الله وبركاته،
أهلاً بك أخي الكريم / أختي الكريمة *${customerName}* 🌿

يسرّنا إعلامك بأنه تم تسليم شحنتك بنجاح من مناحلنا 🍯📦
(فاتورة رقم: #${invoiceId} | بوليصة الشحن: ${trackingNumber})

نتمنى أن تنال منتجاتنا الطبيعية كامل رضاكم وإعجابكم، وبالهناء والعافية دائماً.
نسعد دائماً بخدمتكم وتواصلكم معنا بأي وقت! ✨`;
}

export function openWhatsAppWithMessage(phone: string, text: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  window.open(url, '_blank');
}

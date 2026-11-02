import 'dart:io';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

String generateDeliveryMessage({
  required String customerName,
  required String invoiceId,
  required String trackingNumber,
}) {
  return '''
السلام عليكم ورحمة الله وبركاته،
أهلاً بك أخي الكريم / أختي الكريمة *$customerName* 🌿

يسرّنا إعلامك بأنه تم تسليم شحنتك بنجاح من مناحلنا 🍯📦
(فاتورة رقم: #$invoiceId | بوليصة الشحن: $trackingNumber)

نتمنى أن تنال منتجاتنا الطبيعية كامل رضاكم وإعجابكم، وبالهناء والعافية دائماً.
نسعد دائماً بخدمتكم وتواصلكم معنا بأي وقت! ✨
''';
}

Future<void> sendDeliveryWhatsAppNotification({
  required BuildContext context,
  required String phone,
  required String customerName,
  required String invoiceId,
  required String trackingNumber,
}) async {
  // تنظيف رقم الهاتف وإعداده بالصيغة الدولية
  String cleanPhone = phone.replaceAll(RegExp(r'[^0-9]'), '');

  // إذا بدأ الرقم بـ 05 (تركيا)، نحوله إلى 905
  if (cleanPhone.startsWith('05')) {
    cleanPhone = '90${cleanPhone.substring(1)}';
  } else if (cleanPhone.startsWith('5')) {
    cleanPhone = '90$cleanPhone';
  }

  // تجهيز نص الرسالة وتشفيرها للرابط
  final String rawMessage = generateDeliveryMessage(
    customerName: customerName,
    invoiceId: invoiceId,
    trackingNumber: trackingNumber,
  );
  final String encodedMessage = Uri.encodeComponent(rawMessage);

  // رابط واتساب القياسي
  final Uri whatsappUrl = Uri.parse('https://wa.me/$cleanPhone?text=$encodedMessage');

  try {
    final bool launched = await launchUrl(
      whatsappUrl,
      mode: LaunchMode.externalApplication,
    );

    if (!launched && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تعذر فتح تطبيق واتساب، تأكد من تثبيته')),
      );
    }
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('حدث خطأ أثناء فتح واتساب: $e')),
      );
    }
  }
}

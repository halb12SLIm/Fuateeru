import 'package:flutter/material.dart';
import 'package:printing/printing.dart';
import 'pdf_invoice_service.dart';
import 'logo_data.dart';

/// دالة لمعاينة أو طباعة أو مشاركة الفاتورة مباشرة في Flutter
Future<void> exportAndShareInvoice(
  BuildContext context,
  LogoData data, {
  String invoiceNumber = '1001',
  DateTime? invoiceDate,
  bool shareDirectly = false,
}) async {
  final date = invoiceDate ?? DateTime.now();

  // 1. توليد بايتات الـ PDF باستخدام خط Cairo العربي واتجاه RTL
  final pdfBytes = await PdfInvoiceService.generateInvoice(
    productData: data,
    invoiceNumber: invoiceNumber,
    date: date,
  );

  final safeName = data.productName.isNotEmpty ? data.productName : 'منتج';
  final fileName = 'فاتورة_${safeName}.pdf';

  if (shareDirectly) {
    // خيار 2: مشاركة الملف فوراً عبر التطبيقات الأخرى (Share Sheet - WhatsApp, Email, Telegram, إلخ)
    await Printing.sharePdf(
      bytes: pdfBytes,
      filename: fileName,
    );
  } else {
    // خيار 1: فتح معاينة الطباعة وحفظ PDF عبر نظام التشغيل (Android / iOS / Web / Desktop)
    await Printing.layoutPdf(
      onLayout: (format) async => pdfBytes,
      name: fileName,
    );
  }
}

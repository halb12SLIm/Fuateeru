import 'dart:typed_data';
import 'package:flutter/services.dart' show rootBundle;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

/// كلاس إدارة توليد وطباعة مستندات PDF مع دعم خط Cairo العربي
class InvoicePdfService {
  /// دالة توليد وتصدير فاتورة بتنسيق PDF واستخدام خط Cairo
  static Future<Uint8List> generateInvoicePdf({
    required String invoiceId,
    required String clientName,
    required String clientPhone,
    required String clientAddress,
    required String date,
    required List<Map<String, dynamic>> items,
    required double total,
    required String currencySymbol,
    double discount = 0.0,
    double tax = 0.0,
    double shippingFee = 0.0,
  }) async {
    final pdf = pw.Document();

    // 1. تحميل خط Cairo لدعم اللغة العربية وتشكيل النصوص بدقة
    final fontRegular = await rootBundle.load('assets/fonts/Cairo-Regular.ttf');
    final fontBold = await rootBundle.load('assets/fonts/Cairo-Bold.ttf');
    final ttfRegular = pw.Font.ttf(fontRegular);
    final ttfBold = pw.Font.ttf(fontBold);

    // 2. تصميم صفحة الفاتورة
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        textDirection: pw.TextDirection.rtl,
        theme: pw.ThemeData.withFont(
          base: ttfRegular,
          bold: ttfBold,
        ),
        build: (pw.Context context) {
          return pw.Container(
            padding: const pw.EdgeInsets.all(24),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // ترويسة الفاتورة
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'شركة سليم',
                          style: pw.TextStyle(
                            font: ttfBold,
                            fontSize: 22,
                            color: PdfColors.green800,
                          ),
                        ),
                        pw.Text(
                          'لإنتاج العسل الطبيعي',
                          style: pw.TextStyle(
                            font: ttfRegular,
                            fontSize: 12,
                            color: PdfColors.grey700,
                          ),
                        ),
                      ],
                    ),
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.end,
                      children: [
                        pw.Text(
                          'فاتورة مبيعات',
                          style: pw.TextStyle(
                            font: ttfBold,
                            fontSize: 18,
                            color: PdfColors.green700,
                          ),
                        ),
                        pw.Text('رقم الفاتورة: $invoiceId', style: pw.TextStyle(fontSize: 10)),
                        pw.Text('التاريخ: $date', style: pw.TextStyle(fontSize: 10)),
                      ],
                    ),
                  ],
                ),
                pw.SizedBox(height: 16),
                pw.Divider(color: PdfColors.green700, thickness: 1.5),
                pw.SizedBox(height: 12),

                // بيانات العميل
                pw.Container(
                  padding: const pw.EdgeInsets.all(10),
                  decoration: pw.BoxDecoration(
                    color: PdfColors.grey100,
                    borderRadius: pw.BorderRadius.circular(6),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('العميل: $clientName', style: pw.TextStyle(font: ttfBold, fontSize: 11)),
                      pw.Text('الهاتف: $clientPhone', style: pw.TextStyle(fontSize: 10)),
                      pw.Text('العنوان: $clientAddress', style: pw.TextStyle(fontSize: 10)),
                    ],
                  ),
                ),
                pw.SizedBox(height: 16),

                // جدول المنتجات
                pw.TableHelper.fromTextArray(
                  border: pw.TableBorder.all(color: PdfColors.grey300),
                  headerStyle: pw.TextStyle(font: ttfBold, color: PdfColors.white, fontSize: 10),
                  headerDecoration: const pw.BoxDecoration(color: PdfColors.green700),
                  cellHeight: 24,
                  cellAlignments: {
                    0: pw.Alignment.centerRight,
                    1: pw.Alignment.center,
                    2: pw.Alignment.centerLeft,
                    3: pw.Alignment.centerLeft,
                  },
                  headers: ['المنتج', 'الكمية', 'السعر', 'المجموع'],
                  data: items.map((item) {
                    final qty = (item['qty'] ?? 1).toString();
                    final price = (item['price'] ?? 0.0).toStringAsFixed(2);
                    final subtotal = ((item['price'] ?? 0.0) * (item['qty'] ?? 1)).toStringAsFixed(2);
                    return [
                      item['name'] ?? '',
                      qty,
                      '$price $currencySymbol',
                      '$subtotal $currencySymbol',
                    ];
                  }).toList(),
                ),
                pw.SizedBox(height: 16),

                // ملخص الحساب
                pw.Align(
                  alignment: pw.Alignment.centerLeft,
                  child: pw.Container(
                    width: 220,
                    padding: const pw.EdgeInsets.all(10),
                    decoration: pw.BoxDecoration(
                      border: pw.TableBorder.all(color: PdfColors.amber400).top,
                      color: PdfColors.amber50,
                      borderRadius: pw.BorderRadius.circular(6),
                    ),
                    child: pw.Column(
                      children: [
                        if (discount > 0)
                          pw.Row(
                            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                            children: [
                              pw.Text('الخصم:'),
                              pw.Text('- ${discount.toStringAsFixed(2)} $currencySymbol'),
                            ],
                          ),
                        if (tax > 0)
                          pw.Row(
                            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                            children: [
                              pw.Text('الضريبة ($tax%):'),
                              pw.Text('+ ${tax.toStringAsFixed(2)} $currencySymbol'),
                            ],
                          ),
                        if (shippingFee > 0)
                          pw.Row(
                            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                            children: [
                              pw.Text('رسوم الشحن:'),
                              pw.Text('+ ${shippingFee.toStringAsFixed(2)} $currencySymbol'),
                            ],
                          ),
                        pw.Divider(color: PdfColors.amber600),
                        pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Text('الإجمالي الكلي:', style: pw.TextStyle(font: ttfBold, fontSize: 13, color: PdfColors.green900)),
                            pw.Text('${total.toStringAsFixed(2)} $currencySymbol', style: pw.TextStyle(font: ttfBold, fontSize: 13, color: PdfColors.green900)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                pw.Spacer(),

                // تذييل الفاتورة
                pw.Divider(color: PdfColors.grey400),
                pw.Center(
                  child: pw.Text(
                    'نضمن أصالة ونقاء العسل الطبيعي 100% - شكراً لتعاملكم معنا',
                    style: pw.TextStyle(fontSize: 9, color: PdfColors.grey700),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );

    return pdf.save();
  }

  /// دالة المعاينة والطباعة المباشرة عبر حزمة printing
  static Future<void> printOrShareInvoice({
    required String invoiceId,
    required String clientName,
    required String clientPhone,
    required String clientAddress,
    required String date,
    required List<Map<String, dynamic>> items,
    required double total,
    required String currencySymbol,
    double discount = 0.0,
    double tax = 0.0,
    double shippingFee = 0.0,
  }) async {
    final pdfBytes = await generateInvoicePdf(
      invoiceId: invoiceId,
      clientName: clientName,
      clientPhone: clientPhone,
      clientAddress: clientAddress,
      date: date,
      items: items,
      total: total,
      currencySymbol: currencySymbol,
      discount: discount,
      tax: tax,
      shippingFee: shippingFee,
    );

    // فتح نافذة المعاينة والطباعة أو الحفظ كـ PDF
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdfBytes,
      name: 'Invoice-$invoiceId.pdf',
    );
  }
}

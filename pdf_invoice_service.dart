import 'dart:typed_data';
import 'package:flutter/services.dart' show rootBundle;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'logo_data.dart';

/// خدمة توليد ومعاينة وطباعة فواتير المبيعات مع دعم خط Cairo العربي
class PdfInvoiceService {
  /// توليد بايتات ملف الـ PDF لفاتورة مستخرجة من بيانات الشعار والمنتج
  static Future<Uint8List> generateInvoice({
    required LogoData productData,
    required String invoiceNumber,
    required DateTime date,
    int quantity = 1,
    double unitPrice = 0.0,
    String currency = 'TL',
  }) async {
    final pdf = pw.Document();

    // تحميل خط Cairo العربي (العادي والعريض)
    final fontData = await rootBundle.load('assets/fonts/Cairo-Regular.ttf');
    final ttfFont = pw.Font.ttf(fontData);

    final boldFontData = await rootBundle.load('assets/fonts/Cairo-Bold.ttf');
    final ttfBoldFont = pw.Font.ttf(boldFontData);

    final dateFormatted = '${date.year}/${date.month.toString().padLeft(2, '0')}/${date.day.toString().padLeft(2, '0')}';
    final effectivePrice = (productData.price != null && productData.price! > 0)
        ? productData.price!
        : unitPrice;
    final effectiveCurrency = productData.currency?.isNotEmpty == true
        ? productData.currency!
        : currency;
    final totalAmount = effectivePrice * quantity;

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        textDirection: pw.TextDirection.rtl, // اتجاه الكتابة من اليمين لليسار
        theme: pw.ThemeData.withFont(
          base: ttfFont,
          bold: ttfBoldFont,
        ),
        build: (pw.Context context) {
          return pw.Padding(
            padding: const pw.EdgeInsets.all(32),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // 1. رأس الفاتورة
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'فاتورة مبيعات',
                          style: pw.TextStyle(
                            fontSize: 26,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColors.green800,
                          ),
                        ),
                        pw.SizedBox(height: 4),
                        pw.Text(
                          'نظام التحليل والطباعة الذكي',
                          style: pw.TextStyle(fontSize: 11, color: PdfColors.grey700),
                        ),
                      ],
                    ),
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.end,
                      children: [
                        pw.Container(
                          padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: pw.BoxDecoration(
                            color: PdfColors.green50,
                            borderRadius: pw.BorderRadius.circular(6),
                            border: pw.Border.all(color: PdfColors.green600, width: 1),
                          ),
                          child: pw.Text(
                            'رقم: #$invoiceNumber',
                            style: pw.TextStyle(
                              fontSize: 12,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColors.green900,
                            ),
                          ),
                        ),
                        pw.SizedBox(height: 6),
                        pw.Text(
                          'التاريخ: $dateFormatted',
                          style: pw.TextStyle(fontSize: 10, color: PdfColors.grey800),
                        ),
                      ],
                    ),
                  ],
                ),
                pw.SizedBox(height: 16),
                pw.Divider(color: PdfColors.green700, thickness: 1.5),
                pw.SizedBox(height: 16),

                // 2. بطاقة معلومات العلامة التجارية والمنتج المستخرج
                pw.Container(
                  width: double.infinity,
                  padding: const pw.EdgeInsets.all(14),
                  decoration: pw.BoxDecoration(
                    color: PdfColors.grey100,
                    borderRadius: pw.BorderRadius.circular(8),
                    border: pw.Border.all(color: PdfColors.grey300),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text(
                            'العلامة التجارية: ${productData.brandName}',
                            style: pw.TextStyle(
                              fontSize: 14,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColors.green900,
                            ),
                          ),
                          if (productData.weightOrVolume != null && productData.weightOrVolume!.isNotEmpty)
                            pw.Container(
                              padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: pw.BoxDecoration(
                                color: PdfColors.amber100,
                                borderRadius: pw.BorderRadius.circular(4),
                              ),
                              child: pw.Text(
                                'الوزن / الحجم: ${productData.weightOrVolume}',
                                style: pw.TextStyle(
                                  fontSize: 10,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColors.amber900,
                                ),
                              ),
                            ),
                        ],
                      ),
                      pw.SizedBox(height: 6),
                      pw.Text(
                        'اسم المنتج: ${productData.productName}',
                        style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold),
                      ),
                      if (productData.details.isNotEmpty) ...[
                        pw.SizedBox(height: 6),
                        pw.Text(
                          'المواصفات والتفاصيل: ${productData.details}',
                          style: pw.TextStyle(fontSize: 10, color: PdfColors.grey800),
                        ),
                      ],
                    ],
                  ),
                ),
                pw.SizedBox(height: 20),

                // 3. جدول عناصر الفاتورة
                pw.TableHelper.fromTextArray(
                  border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.8),
                  headerStyle: pw.TextStyle(
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.white,
                    fontSize: 11,
                  ),
                  headerDecoration: const pw.BoxDecoration(color: PdfColors.green700),
                  cellHeight: 28,
                  cellAlignments: {
                    0: pw.Alignment.centerRight,
                    1: pw.Alignment.center,
                    2: pw.Alignment.centerLeft,
                    3: pw.Alignment.centerLeft,
                  },
                  headers: ['البند / الوصف', 'الكمية', 'سعر الوحدة', 'الإجمالي'],
                  data: [
                    [
                      '${productData.productName} (${productData.brandName})',
                      '$quantity',
                      '${effectivePrice.toStringAsFixed(2)} $effectiveCurrency',
                      '${totalAmount.toStringAsFixed(2)} $effectiveCurrency',
                    ],
                  ],
                ),
                pw.SizedBox(height: 20),

                // 4. ملخص الحساب والإجمالي
                pw.Align(
                  alignment: pw.Alignment.centerLeft,
                  child: pw.Container(
                    width: 240,
                    padding: const pw.EdgeInsets.all(12),
                    decoration: pw.BoxDecoration(
                      color: PdfColors.amber50,
                      borderRadius: pw.BorderRadius.circular(8),
                      border: pw.Border.all(color: PdfColors.amber400, width: 1),
                    ),
                    child: pw.Column(
                      children: [
                        pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Text('المجموع الفرعي:', style: pw.TextStyle(fontSize: 11)),
                            pw.Text(
                              '${totalAmount.toStringAsFixed(2)} $effectiveCurrency',
                              style: pw.TextStyle(fontSize: 11),
                            ),
                          ],
                        ),
                        pw.SizedBox(height: 6),
                        pw.Divider(color: PdfColors.amber300, thickness: 0.8),
                        pw.SizedBox(height: 6),
                        pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Text(
                              'المبلغ المستحق:',
                              style: pw.TextStyle(
                                fontSize: 13,
                                fontWeight: pw.FontWeight.bold,
                                color: PdfColors.green900,
                              ),
                            ),
                            pw.Text(
                              '${totalAmount.toStringAsFixed(2)} $effectiveCurrency',
                              style: pw.TextStyle(
                                fontSize: 14,
                                fontWeight: pw.FontWeight.bold,
                                color: PdfColors.green900,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                pw.Spacer(),

                // 5. تذييل الفاتورة
                pw.Divider(color: PdfColors.grey300),
                pw.SizedBox(height: 6),
                pw.Center(
                  child: pw.Text(
                    'تم إنشاء هذه الفاتورة إلكترونياً بدقة عبر الذكاء الاصطناعي - شكراً لتعاملكم معنا',
                    style: pw.TextStyle(fontSize: 9, color: PdfColors.grey600),
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

  /// دالة عرض شاشة المعاينة والطباعة المباشرة في Flutter
  static Future<void> printInvoice({
    required LogoData productData,
    required String invoiceNumber,
    required DateTime date,
    int quantity = 1,
    double unitPrice = 0.0,
    String currency = 'TL',
  }) async {
    final pdfBytes = await generateInvoice(
      productData: productData,
      invoiceNumber: invoiceNumber,
      date: date,
      quantity: quantity,
      unitPrice: unitPrice,
      currency: currency,
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdfBytes,
      name: 'invoice-$invoiceNumber.pdf',
    );
  }

  /// دالة المشاركة المباشرة لملف الـ PDF مع تطبيقات أخرى (WhatsApp, Telegram, البريد...)
  static Future<void> shareInvoice({
    required LogoData productData,
    required String invoiceNumber,
    required DateTime date,
    int quantity = 1,
    double unitPrice = 0.0,
    String currency = 'TL',
  }) async {
    final pdfBytes = await generateInvoice(
      productData: productData,
      invoiceNumber: invoiceNumber,
      date: date,
      quantity: quantity,
      unitPrice: unitPrice,
      currency: currency,
    );

    await Printing.sharePdf(
      bytes: pdfBytes,
      filename: 'invoice-$invoiceNumber.pdf',
    );
  }
}

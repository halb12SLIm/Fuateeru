import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:printing/printing.dart';
import 'logo_data.dart';
import 'pdf_invoice_service.dart';

/// شاشة إدخال البيانات والملء التلقائي مع معالجة أذونات الكاميرا بأمان
class EditFormScreen extends StatefulWidget {
  final LogoData? initialData;

  const EditFormScreen({super.key, this.initialData});

  @override
  State<EditFormScreen> createState() => _EditFormScreenState();
}

class _EditFormScreenState extends State<EditFormScreen> {
  // وحدات التحكم بالحقول النصية
  final TextEditingController _brandController = TextEditingController();
  final TextEditingController _productController = TextEditingController();
  final TextEditingController _detailsController = TextEditingController();
  final TextEditingController _weightController = TextEditingController();
  final TextEditingController _priceController = TextEditingController();
  final TextEditingController _currencyController = TextEditingController(text: 'TL');

  bool _isLoading = false;
  Uint8List? _scannedImageBytes;

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      _applyDataToControllers(widget.initialData!);
    }
  }

  @override
  void dispose() {
    _brandController.dispose();
    _productController.dispose();
    _detailsController.dispose();
    _weightController.dispose();
    _priceController.dispose();
    _currencyController.dispose();
    super.dispose();
  }

  void _applyDataToControllers(LogoData data) {
    _brandController.text = data.brandName;
    _productController.text = data.productName;
    _detailsController.text = data.details;
    if (data.weightOrVolume != null) {
      _weightController.text = data.weightOrVolume!;
    }
    if (data.price != null) {
      _priceController.text = data.price!.toString();
    }
    if (data.currency != null && data.currency!.isNotEmpty) {
      _currencyController.text = data.currency!;
    }
  }

  /// التقاط صورة بالكاميرا بأمان تام وبدون أي إغلاق مفاجئ عند رفض الإذن
  Future<void> _scanFromCamera() async {
    final picker = ImagePicker();
    try {
      final XFile? photo = await picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85, // تقليل الحجم قليلاً لسرعة الرفع والدقة
      );

      // في حال قام المستخدم بإلغاء الكاميرا بالرجوع للخلف
      if (photo == null) return;

      setState(() => _isLoading = true);

      final Uint8List bytes = await photo.readAsBytes();
      setState(() => _scannedImageBytes = bytes);

      // محاكاة أو استدعاء خدمة Gemini لاستخراج البيانات
      // final LogoData? data = await geminiService.extractLogoDetails(imageBytes: bytes);
      // هنا نموذج تجريبي في حال عدم الاتصال بالسيرفر
      _simulateExtraction(bytes);

    } catch (e) {
      setState(() => _isLoading = false);
      // معالجة الخطأ أو رفض الإذن بدون انهيار التطبيق
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('تعذر فتح الكاميرا: قد يكون تم رفض الإذن. يمكنك اختيار صورة من المعرض ($e)'),
            backgroundColor: Colors.red.shade700,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  /// اختيار صورة من معرض الصور
  Future<void> _pickFromGallery() async {
    final picker = ImagePicker();
    try {
      final XFile? photo = await picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );

      if (photo == null) return;

      setState(() => _isLoading = true);

      final Uint8List bytes = await photo.readAsBytes();
      setState(() => _scannedImageBytes = bytes);
      _simulateExtraction(bytes);

    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('حدث خطأ أثناء قراءة الصورة: $e'),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    }
  }

  /// محاكاة تعبئة البيانات بالذكاء الاصطناعي
  void _simulateExtraction(Uint8List bytes) {
    Future.delayed(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _brandController.text = 'شركة سليم';
        _productController.text = 'عسل سدر جبلي فاخر';
        _weightController.text = '1 كغ';
        _detailsController.text = 'عسل سدر طبيعي 100% مستخلص من زهور السدر البرية - غير مبستر ومفحوص مخبرياً';
        _priceController.text = '250';
        _currencyController.text = 'TL';
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم استخراج بيانات الشعار وملء الحقول والأسعار تلقائياً بنجاح!'),
          backgroundColor: Color(0xFF1B6E39),
        ),
      );
    });
  }

  /// تصدير وطباعة الفاتورة الفورية
  Future<void> _generateAndPrintPdf() async {
    final currentData = LogoData(
      brandName: _brandController.text.trim().isEmpty ? 'شركة سليم' : _brandController.text.trim(),
      productName: _productController.text.trim().isEmpty ? 'عسل طبيعي' : _productController.text.trim(),
      details: _detailsController.text.trim(),
      weightOrVolume: _weightController.text.trim().isEmpty ? null : _weightController.text.trim(),
      price: double.tryParse(_priceController.text.trim()),
      currency: _currencyController.text.trim(),
    );

    await PdfInvoiceService.printInvoice(
      productData: currentData,
      invoiceNumber: 'INV-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      date: DateTime.now(),
      unitPrice: currentData.price ?? 0.0,
      currency: currentData.currency ?? 'TL',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: const Color(0xFF1B6E39),
          title: const Text('إدخال البيانات والملء التلقائي', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
          actions: [
            IconButton(
              icon: const Icon(Icons.picture_as_pdf),
              tooltip: 'فاتورة PDF',
              onPressed: _generateAndPrintPdf,
            ),
          ],
        ),
        body: _isLoading
            ? const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(color: Color(0xFF1B6E39)),
                    SizedBox(height: 16),
                    Text('جاري فحص الشعار واستخراج البيانات بالذكاء الاصطناعي...', style: TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // زر المسح بالكاميرا
                    ElevatedButton.icon(
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('مسح الشعار وملء الحقول بالكاميرا', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0088CC),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _scanFromCamera,
                    ),
                    const SizedBox(height: 8),

                    // زر المعرض
                    OutlinedButton.icon(
                      icon: const Icon(Icons.photo_library),
                      label: const Text('أو اختيار صورة من المعرض'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _pickFromGallery,
                    ),
                    const SizedBox(height: 16),

                    // حقل 1: العلامة التجارية
                    TextField(
                      controller: _brandController,
                      decoration: const InputDecoration(
                        labelText: 'العلامة التجارية / اسم الشعار',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.branding_watermark_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // حقل 2: اسم المنتج
                    TextField(
                      controller: _productController,
                      decoration: const InputDecoration(
                        labelText: 'اسم المنتج',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.shopping_bag_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // حقل 3 و 4: الوزن والسعر
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _weightController,
                            decoration: const InputDecoration(
                              labelText: 'الوزن / الحجم',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.scale_outlined),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: _priceController,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'السعر',
                              border: const OutlineInputBorder(),
                              suffixText: _currencyController.text,
                              prefixIcon: const Icon(Icons.attach_money_outlined),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // حقل 5: التفاصيل والمواصفات
                    TextField(
                      controller: _detailsController,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'المواصفات والتفاصيل المكتوبة',
                        border: OutlineInputBorder(),
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // زر توليد ومعاينة الـ PDF
                    ElevatedButton.icon(
                      icon: const Icon(Icons.print),
                      label: const Text('معاينة وطباعة فاتورة PDF', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1B6E39),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _generateAndPrintPdf,
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'shipment_model.dart';
import 'barcode_scanner_screen.dart';

class FirebaseCustomerAddressService {
  static Future<void> updateCustomerAddress(String customerId, String newAddress) async {
    try {
      // إذا كنت تستخدم Firebase:
      // await FirebaseFirestore.instance.collection('customers').doc(customerId).update({'address': newAddress});
    } catch (e) {
      debugPrint('Error updating customer address: $e');
    }
  }
}

class CreateShipmentScreen extends StatefulWidget {
  final String invoiceId;
  final String customerId;
  final String initialName;
  final String initialPhone;
  final String initialAddress;

  const CreateShipmentScreen({
    super.key,
    required this.invoiceId,
    required this.customerId,
    required this.initialName,
    required this.initialPhone,
    required this.initialAddress,
  });

  @override
  State<CreateShipmentScreen> createState() => _CreateShipmentScreenState();
}

class _CreateShipmentScreenState extends State<CreateShipmentScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _addressCtrl;
  late TextEditingController _trackingCtrl;
  late TextEditingController _weightCtrl;
  String _selectedCompany = 'Yurtiçi Kargo';

  final List<String> _companies = [
    'Yurtiçi Kargo',
    'Aras Kargo',
    'PTT Kargo',
    'MNG Kargo',
    'DPD (شحن دولي)',
  ];

  @override
  void initState() {
    super.initState();
    _addressCtrl = TextEditingController(text: widget.initialAddress);
    _trackingCtrl = TextEditingController();
    _weightCtrl = TextEditingController(text: '2.0');
  }

  @override
  void dispose() {
    _addressCtrl.dispose();
    _trackingCtrl.dispose();
    _weightCtrl.dispose();
    super.dispose();
  }

  void _saveAndPrintLabel() async {
    if (!_formKey.currentState!.validate()) return;

    final updatedAddress = _addressCtrl.text.trim();

    // 1. تحديث عنوان الزبون تلقائياً إذا تغير
    if (updatedAddress != widget.initialAddress && widget.customerId.isNotEmpty) {
      await FirebaseCustomerAddressService.updateCustomerAddress(widget.customerId, updatedAddress);
    }

    // 2. إنشاء كائن الشحنة الجديد
    final newShipment = Shipment(
      id: 'SHP-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      invoiceId: widget.invoiceId,
      customerId: widget.customerId,
      customerName: widget.initialName,
      customerPhone: widget.initialPhone,
      fullAddress: updatedAddress,
      cargoCompany: _selectedCompany,
      trackingNumber: _trackingCtrl.text.trim(),
      packageWeightKg: double.tryParse(_weightCtrl.text.trim()) ?? 1.0,
      createdAt: DateTime.now(),
    );

    Navigator.pop(context, newShipment);
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: const Color(0xFF1B6E39),
          elevation: 0,
          title: const Text(
            'إنشاء ملصق شحن',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
        ),
        body: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // بطاقة ملخص الفاتورة والزبون
              Card(
                color: const Color(0xFF8B5A2B).withOpacity(0.1),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: const Color(0xFF8B5A2B).withOpacity(0.3)),
                ),
                child: ListTile(
                  leading: const Icon(Icons.receipt_long, color: Color(0xFF8B5A2B)),
                  title: Text(
                    'مرتبطة بالفاتورة: #${widget.invoiceId}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text('المستلم: ${widget.initialName} (${widget.initialPhone})'),
                ),
              ),
              const SizedBox(height: 16),

              // اختيار شركة الشحن
              DropdownButtonFormField<String>(
                value: _selectedCompany,
                decoration: const InputDecoration(
                  labelText: 'شركة الشحن الناقلة',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.local_shipping_outlined),
                ),
                items: _companies.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _selectedCompany = val);
                  }
                },
              ),
              const SizedBox(height: 14),

              // كود التتبع مع زر المسح بالكاميرا
              TextFormField(
                controller: _trackingCtrl,
                decoration: InputDecoration(
                  labelText: 'رقم بوليصة / تتبع الشحنة (Takip No)',
                  hintText: 'امسح الباركود بالكاميرا أو اكتبه',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.local_shipping_outlined),
                  // زر تشغيل الماسح بجانب الحقل مباشرة
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.qr_code_scanner, color: Color(0xFF8B5A2B), size: 28),
                    tooltip: 'مسح الباركود عبر الكاميرا',
                    onPressed: () async {
                      // فتح شاشة الكاميرا وانتظار قراءة الباركود
                      final String? scannedCode = await Navigator.push<String>(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const BarcodeScannerScreen(),
                        ),
                      );

                      if (scannedCode != null && scannedCode.isNotEmpty) {
                        setState(() {
                          // ملء الحقل تلقائياً برقم الباركود الممسوح
                          _trackingCtrl.text = scannedCode;
                        });

                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('تم قراءة باركود الشحنة بنجاح: $scannedCode'),
                              backgroundColor: const Color(0xFF1B6E39),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      }
                    },
                  ),
                ),
                validator: (v) => v == null || v.isEmpty ? 'يرجى مسح أو إدخال رقم التتبع' : null,
              ),
              const SizedBox(height: 14),

              // العنوان (مع التنبيه بالحفظ التلقائي)
              TextFormField(
                controller: _addressCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'عنوان التسليم بالتفصيل',
                  helperText: 'أي تعديل هنا سيُحفظ تلقائياً في سجل الزبون للمرات القادمة',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.home_outlined),
                ),
                validator: (v) => v == null || v.isEmpty ? 'يرجى كتابة العنوان' : null,
              ),
              const SizedBox(height: 14),

              // الوزن
              TextFormField(
                controller: _weightCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'الوزن التقريبي للطرود (كغ)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.scale_outlined),
                ),
              ),
              const SizedBox(height: 24),

              // زر الحفظ وتوليد الملصق
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  backgroundColor: const Color(0xFF1B6E39),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                onPressed: _saveAndPrintLabel,
                icon: const Icon(Icons.print_outlined),
                label: const Text(
                  'حفظ السجل وتجهيز الملصق الحراري',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'shipment_model.dart';
import 'delivery_message_service.dart';

class ShipmentsManagerScreen extends StatefulWidget {
  const ShipmentsManagerScreen({super.key});

  @override
  State<ShipmentsManagerScreen> createState() => _ShipmentsManagerScreenState();
}

class _ShipmentsManagerScreenState extends State<ShipmentsManagerScreen> {
  final TextEditingController _searchCtrl = TextEditingController();

  // سجل الشحنات التراكمي
  List<Shipment> allShipments = [
    Shipment(
      id: 'SHP-901',
      invoiceId: '1042',
      customerId: 'CUST-1',
      customerName: 'محمد العلي',
      customerPhone: '05551234567',
      fullAddress: 'إسطنبول - الفاتح - شارع فوزي باشا بناء 12',
      cargoCompany: 'Yurtiçi Kargo',
      trackingNumber: '9284719302',
      packageWeightKg: 4.5,
      createdAt: DateTime.now().subtract(const Duration(hours: 5)),
    ),
    Shipment(
      id: 'SHP-902',
      invoiceId: '1043',
      customerId: 'CUST-2',
      customerName: 'أحمد محمود',
      customerPhone: '05339876543',
      fullAddress: 'أنطاليا - كونيالتي - حي ليمان',
      cargoCompany: 'Aras Kargo',
      trackingNumber: '4839201948',
      packageWeightKg: 2.0,
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
    ),
    Shipment(
      id: 'SHP-903',
      invoiceId: '1044',
      customerId: 'CUST-3',
      customerName: 'خالد السليم',
      customerPhone: '05051112233',
      fullAddress: 'بورصة - نيلوفر - حي أودونلوك',
      cargoCompany: 'PTT Kargo',
      trackingNumber: '6192837401',
      packageWeightKg: 3.2,
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
    ),
  ];

  List<Shipment> filteredShipments = [];

  @override
  void initState() {
    super.initState();
    filteredShipments = allShipments;
    _searchCtrl.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    final query = _searchCtrl.text.trim().toLowerCase();
    setState(() {
      if (query.isEmpty) {
        filteredShipments = allShipments;
      } else {
        filteredShipments = allShipments.where((s) {
          final matchesInvoice = s.invoiceId.toLowerCase().contains(query);
          final matchesTracking = s.trackingNumber.toLowerCase().contains(query);
          final matchesName = s.customerName.toLowerCase().contains(query);
          final matchesPhone = s.customerPhone.contains(query);

          return matchesInvoice || matchesTracking || matchesName || matchesPhone;
        }).toList();
      }
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _printThermalLabel(Shipment shipment) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('جاري تجهيز وطباعة الملصق الحراري للشحنة #${shipment.id}...'),
          backgroundColor: const Color(0xFF1B6E39),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
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
            'سجل الشحنات والطرود',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
        ),
        body: Column(
          children: [
            // شريط البحث المزدوج
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: TextField(
                controller: _searchCtrl,
                decoration: InputDecoration(
                  hintText: 'ابحث برقم الفاتورة، رقم التتبع، أو اسم الزبون...',
                  hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF1B6E39)),
                  suffixIcon: _searchCtrl.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () => _searchCtrl.clear(),
                        )
                      : null,
                  filled: true,
                  fillColor: Colors.grey.shade100,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF1B6E39), width: 1.5),
                  ),
                ),
              ),
            ),

            // قائمة نتائج الشحنات
            Expanded(
              child: filteredShipments.isEmpty
                  ? const Center(
                      child: Text(
                        'لم يتم العثور على أي شحنة مطابقة',
                        style: TextStyle(color: Colors.grey, fontSize: 15),
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      itemCount: filteredShipments.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final item = filteredShipments[index];
                        return Card(
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.grey.shade200),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // رأس البطاقة: شركة الشحن ورقم الفاتورة
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Chip(
                                      avatar: const Icon(Icons.local_shipping, size: 16, color: Color(0xFF1B6E39)),
                                      label: Text(
                                        item.cargoCompany,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                          color: Color(0xFF1B6E39),
                                        ),
                                      ),
                                      backgroundColor: const Color(0xFF1B6E39).withOpacity(0.1),
                                      side: BorderSide.none,
                                    ),
                                    Text(
                                      'فاتورة #${item.invoiceId}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 15,
                                        color: Colors.black87,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),

                                // رقم التتبع
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Colors.grey.shade300),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.tag, size: 18, color: Colors.blueGrey),
                                      const SizedBox(width: 6),
                                      const Text(
                                        'رقم التتبع: ',
                                        style: TextStyle(color: Colors.grey, fontSize: 13),
                                      ),
                                      Expanded(
                                        child: SelectableText(
                                          item.trackingNumber,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: Colors.blue,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 10),

                                // اسم الزبون والعنوان
                                Text(
                                  'المستلم: ${item.customerName} - ${item.customerPhone}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(Icons.location_on_outlined, size: 16, color: Colors.grey),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        'العنوان: ${item.fullAddress}',
                                        style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                                      ),
                                    ),
                                  ],
                                ),
                                const Divider(height: 20),

                                // إجراءات سريعة: إعادة طباعة الملصق وإرسال إشعار الواتساب
                                Wrap(
                                  alignment: WrapAlignment.between,
                                  cross: WrapCrossAlignment.center,
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    Text(
                                      'الوزن: ${item.packageWeightKg} كغ',
                                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                                    ),
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        ElevatedButton.icon(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.green.shade700,
                                            foregroundColor: Colors.white,
                                            elevation: 0,
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                          ),
                                          icon: const Icon(Icons.mark_chat_read, size: 16),
                                          label: const Text(
                                            'إرسال تم التسليم للزبون عبر واتساب',
                                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                          ),
                                          onPressed: () {
                                            sendDeliveryWhatsAppNotification(
                                              context: context,
                                              phone: item.customerPhone,
                                              customerName: item.customerName,
                                              invoiceId: item.invoiceId,
                                              trackingNumber: item.trackingNumber,
                                            );
                                          },
                                        ),
                                        const SizedBox(width: 6),
                                        OutlinedButton.icon(
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor: const Color(0xFF1B6E39),
                                            side: const BorderSide(color: Color(0xFF1B6E39)),
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                          ),
                                          icon: const Icon(Icons.print_outlined, size: 16),
                                          label: const Text('طباعة', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                          onPressed: () => _printThermalLabel(item),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

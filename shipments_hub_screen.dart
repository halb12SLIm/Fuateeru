import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'barcode_scanner_screen.dart';
import 'delivery_message_service.dart';

class ShipmentsHubScreen extends StatefulWidget {
  const ShipmentsHubScreen({super.key});

  @override
  State<ShipmentsHubScreen> createState() => _ShipmentsHubScreenState();
}

class _ShipmentsHubScreenState extends State<ShipmentsHubScreen> {
  final TextEditingController _searchCtrl = TextEditingController();

  // بيانات شحنات تجريبية
  List<Map<String, String>> shipments = [
    {
      'invoiceId': '1042',
      'customerName': 'محمد العلي',
      'customerPhone': '05551234567',
      'address': 'إسطنبول - الفاتح - بناء 12',
      'company': 'Yurtiçi Kargo',
      'trackingNo': '9284719302',
      'status': 'تم الشحن',
      'date': 'اليوم 11:30 ص',
    },
    {
      'invoiceId': '1043',
      'customerName': 'أحمد محمود',
      'customerPhone': '05339876543',
      'address': 'أنطاليا - كونيالتي',
      'company': 'Yurtiçi Kargo',
      'trackingNo': '4839201948',
      'status': 'تم التسليم',
      'date': 'أمس',
    },
  ];

  List<Map<String, String>> filteredShipments = [];

  @override
  void initState() {
    super.initState();
    filteredShipments = shipments;
    _searchCtrl.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    final query = _searchCtrl.text.trim().toLowerCase();
    setState(() {
      if (query.isEmpty) {
        filteredShipments = shipments;
      } else {
        filteredShipments = shipments.where((s) {
          final matchesInvoice = (s['invoiceId'] ?? '').toLowerCase().contains(query);
          final matchesTracking = (s['trackingNo'] ?? '').toLowerCase().contains(query);
          final matchesName = (s['customerName'] ?? '').toLowerCase().contains(query);
          final matchesPhone = (s['customerPhone'] ?? '').contains(query);

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

  void _scanBarcodeAndSearch() async {
    final String? scannedCode = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (context) => const BarcodeScannerScreen(),
      ),
    );

    if (scannedCode != null && scannedCode.isNotEmpty) {
      _searchCtrl.text = scannedCode;
    }
  }

  void _openYurticiOnlineTracking(String trackingNo) async {
    final Uri url = Uri.parse('https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=$trackingNo');
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('تعذر فتح رابط التتبع: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    int inTransitCount = shipments.where((s) => s['status'] == 'تم الشحن').length;
    int deliveredCount = shipments.where((s) => s['status'] == 'تم التسليم').length;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('إدارة الشحن والطرود', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
          backgroundColor: const Color(0xFF1B6E39),
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.qr_code_scanner, color: Colors.white),
              tooltip: 'مسح باركود شحنة',
              onPressed: _scanBarcodeAndSearch,
            ),
          ],
        ),
        body: Column(
          children: [
            // 1. بطاقات ملخص سريعة
            Container(
              padding: const EdgeInsets.all(12),
              color: const Color(0xFF1B6E39).withOpacity(0.08),
              child: Row(
                children: [
                  Expanded(
                    child: _buildSummaryCard('قيد التوصيل', '$inTransitCount طرد', Icons.local_shipping, Colors.orange.shade800),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildSummaryCard('تم التسليم', '$deliveredCount طرد', Icons.check_circle, const Color(0xFF1B6E39)),
                  ),
                ],
              ),
            ),

            // 2. شريط البحث الفوري (فاتورة، تتبع، زبون)
            Padding(
              padding: const EdgeInsets.all(12),
              child: TextField(
                controller: _searchCtrl,
                decoration: InputDecoration(
                  hintText: 'ابحث برقم الفاتورة، الباركود، أو الزبون...',
                  hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF1B6E39)),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.qr_code_scanner, color: Color(0xFF8B5A2B)),
                    onPressed: _scanBarcodeAndSearch,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  filled: true,
                  fillColor: Colors.grey.shade100,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1B6E39), width: 1.5)),
                ),
              ),
            ),

            // 3. قائمة سجل الشحنات
            Expanded(
              child: filteredShipments.isEmpty
                  ? const Center(
                      child: Text('لم يتم العثور على أي شحنة مطابقة', style: TextStyle(color: Colors.grey, fontSize: 15)),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      itemCount: filteredShipments.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final item = filteredShipments[index];
                        final bool isDelivered = item['status'] == 'تم التسليم';

                        return Card(
                          elevation: 2,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // الشركة، الفاتورة والحالة
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF1B6E39).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        item['company'] ?? '',
                                        style: const TextStyle(color: Color(0xFF1B6E39), fontWeight: FontWeight.bold, fontSize: 12),
                                      ),
                                    ),
                                    Text(
                                      'فاتورة #${item['invoiceId']}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isDelivered ? Colors.green.shade50 : Colors.blue.shade50,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        item['status'] ?? '',
                                        style: TextStyle(
                                          color: isDelivered ? const Color(0xFF1B6E39) : Colors.blue.shade800,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),

                                // كود الباركود والتتبع
                                Row(
                                  children: [
                                    const Icon(Icons.qr_code_2, size: 18, color: Colors.grey),
                                    const SizedBox(width: 6),
                                    const Text('التتبع: ', style: TextStyle(color: Colors.grey, fontSize: 13)),
                                    SelectableText(
                                      item['trackingNo'] ?? '',
                                      style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue, fontSize: 14),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),

                                // اسم الزبون والعنوان التلقائي
                                Text(
                                  'الزبون: ${item['customerName']} (${item['customerPhone']})',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'العنوان: ${item['address']}',
                                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                ),
                                const Divider(height: 20),

                                // الأزرار التفاعلية المباشرة
                                Row(
                                  children: [
                                    // 1. تتبع مباشر على موقع Yurtiçi
                                    OutlinedButton.icon(
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        side: BorderSide(color: Colors.orange.shade800),
                                        foregroundColor: Colors.orange.shade800,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      icon: const Icon(Icons.travel_explore, size: 16),
                                      label: const Text('تتبع أونلاين', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                      onPressed: () => _openYurticiOnlineTracking(item['trackingNo'] ?? ''),
                                    ),
                                    const Spacer(),

                                    // 2. إرسال إشعار التسليم واتساب
                                    ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        backgroundColor: Colors.green.shade700,
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      icon: const Icon(Icons.send, size: 16),
                                      label: const Text('واتساب التسليم', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                      onPressed: () {
                                        sendDeliveryWhatsAppNotification(
                                          context: context,
                                          phone: item['customerPhone'] ?? '',
                                          customerName: item['customerName'] ?? '',
                                          invoiceId: item['invoiceId'] ?? '',
                                          trackingNumber: item['trackingNo'] ?? '',
                                        );
                                      },
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

  Widget _buildSummaryCard(String title, String count, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: color.withOpacity(0.12),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
              Text(count, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }
}

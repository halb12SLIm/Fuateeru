import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:url_launcher/url_launcher.dart';

void main() {
  runApp(const HoneyERPApp());
}

class HoneyERPApp extends StatelessWidget {
  const HoneyERPApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: MaterialApp(
        title: 'إدارة الفواتير والشحن والديون',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.amber,
          primaryColor: const Color(0xFF1B6E39),
          scaffoldBackgroundColor: const Color(0xFFF9FAFB),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF1B6E39),
            foregroundColor: Colors.white,
            centerTitle: true,
            elevation: 1,
          ),
        ),
        home: const MainDashboardScreen(),
      ),
    );
  }
}

// ============================================================================
// 1. نماذج البيانات (Models)
// ============================================================================

class CustomerModel {
  String id;
  String name;
  String phone;
  String address;
  double totalDebt; // إجمالي الديون المستحقة عليه

  CustomerModel({
    required this.id,
    required this.name,
    required this.phone,
    required this.address,
    this.totalDebt = 0.0,
  });
}

class InvoiceItemModel {
  String name;
  double quantity;
  double unitPrice;

  InvoiceItemModel({
    required this.name,
    required this.quantity,
    required this.unitPrice,
  });

  double get total => quantity * unitPrice;
}

class InvoiceModel {
  String id;
  String customerName;
  String customerPhone;
  List<InvoiceItemModel> items;

  InvoiceModel({
    required this.id,
    required this.customerName,
    required this.customerPhone,
    required this.items,
  });

  double get grandTotal => items.fold(0.0, (sum, i) => sum + i.total);
}

class ShipmentModel {
  String id;
  String invoiceId;
  String customerName;
  String customerPhone;
  String address;
  String cargoCompany;
  String trackingNumber;
  String status;

  ShipmentModel({
    required this.id,
    required this.invoiceId,
    required this.customerName,
    required this.customerPhone,
    required this.address,
    required this.cargoCompany,
    required this.trackingNumber,
    this.status = 'تم الشحن',
  });
}

// ============================================================================
// 2. الشاشة الرئيسية والتحكم بالأقسام عبر الشريط السفلي
// ============================================================================

class MainDashboardScreen extends StatefulWidget {
  const MainDashboardScreen({super.key});

  @override
  State<MainDashboardScreen> createState() => _MainDashboardScreenState();
}

class _MainDashboardScreenState extends State<MainDashboardScreen> {
  int _currentIndex = 0;

  // بيانات النظام المركزية
  List<CustomerModel> customers = [
    CustomerModel(
      id: '1',
      name: 'محمد العلي',
      phone: '05551234567',
      address: 'إسطنبول - الفاتح - بناء 12',
      totalDebt: 650.0,
    ),
    CustomerModel(
      id: '2',
      name: 'أحمد محمود',
      phone: '05339876543',
      address: 'أنطاليا - مراد باشا',
      totalDebt: 0.0,
    ),
  ];

  List<InvoiceModel> invoices = [
    InvoiceModel(
      id: '1042',
      customerName: 'محمد العلي',
      customerPhone: '05551234567',
      items: [
        InvoiceItemModel(name: 'عسل سدر طبيعي (1 كغ)', quantity: 2, unitPrice: 450),
      ],
    ),
  ];

  List<ShipmentModel> shipments = [
    ShipmentModel(
      id: 'SHP-901',
      invoiceId: '1042',
      customerName: 'محمد العلي',
      customerPhone: '05551234567',
      address: 'إسطنبول - الفاتح - بناء 12',
      cargoCompany: 'Yurtiçi Kargo',
      trackingNumber: '9284719302',
      status: 'تم الشحن',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final screens = [
      // 1. ميزة العملاء المستقلة
      CustomersSection(
        customers: customers,
        onAddCustomer: (c) => setState(() => customers.insert(0, c)),
        onUpdateCustomer: (c, idx) => setState(() => customers[idx] = c),
      ),
      // 2. ميزة الديون المستقلة
      DebtsSection(
        customers: customers,
        onUpdateDebt: (idx, newDebt) => setState(() => customers[idx].totalDebt = newDebt),
      ),
      // 3. ميزة ملصقات الشحن والطرود المستقلة
      ShipmentsSection(
        shipments: shipments,
        customers: customers,
        onAddShipment: (s) => setState(() => shipments.insert(0, s)),
        onUpdateStatus: (idx, status) => setState(() => shipments[idx].status = status),
      ),
      // 4. ميزة الفواتير
      InvoicesSection(
        invoices: invoices,
        onUpdateInvoice: (inv, idx) => setState(() => invoices[idx] = inv),
      ),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF1B6E39),
        unselectedItemColor: Colors.blueGrey.shade400,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.people), label: 'العملاء'),
          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet), label: 'الديون'),
          BottomNavigationBarItem(icon: Icon(Icons.local_shipping), label: 'ملصق الشحن'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long), label: 'الفواتير'),
        ],
      ),
    );
  }
}

// ============================================================================
// 3. قسم العملاء المستقل (إضافة عميل كامل - تعديل بياناته)
// ============================================================================

class CustomersSection extends StatelessWidget {
  final List<CustomerModel> customers;
  final Function(CustomerModel) onAddCustomer;
  final Function(CustomerModel, int) onUpdateCustomer;

  const CustomersSection({
    super.key,
    required this.customers,
    required this.onAddCustomer,
    required this.onUpdateCustomer,
  });

  void _openCustomerDialog(BuildContext context, {CustomerModel? customer, int? index}) {
    final nameCtrl = TextEditingController(text: customer?.name ?? '');
    final phoneCtrl = TextEditingController(text: customer?.phone ?? '');
    final addrCtrl = TextEditingController(text: customer?.address ?? '');

    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: Text(customer == null ? 'إضافة عميل جديد' : 'تعديل بيانات العميل'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'اسم العميل الكامل', prefixIcon: Icon(Icons.person)),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'رقم الهاتف', prefixIcon: Icon(Icons.phone)),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: addrCtrl,
                  maxLines: 2,
                  decoration: const InputDecoration(labelText: 'العنوان التفصيلي للشحن', prefixIcon: Icon(Icons.home)),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1B6E39), foregroundColor: Colors.white),
              onPressed: () {
                if (nameCtrl.text.isNotEmpty && phoneCtrl.text.isNotEmpty) {
                  if (customer == null) {
                    onAddCustomer(CustomerModel(
                      id: DateTime.now().millisecondsSinceEpoch.toString(),
                      name: nameCtrl.text.trim(),
                      phone: phoneCtrl.text.trim(),
                      address: addrCtrl.text.trim(),
                    ));
                  } else {
                    customer.name = nameCtrl.text.trim();
                    customer.phone = phoneCtrl.text.trim();
                    customer.address = addrCtrl.text.trim();
                    onUpdateCustomer(customer, index!);
                  }
                  Navigator.pop(ctx);
                }
              },
              child: const Text('حفظ'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('دليل وإدارة العملاء')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF1B6E39),
        foregroundColor: Colors.white,
        child: const Icon(Icons.person_add),
        onPressed: () => _openCustomerDialog(context),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: customers.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (ctx, idx) {
          final c = customers[idx];
          return Card(
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            child: ListTile(
              leading: const CircleAvatar(
                backgroundColor: Color(0xFFFEF3C7),
                child: Icon(Icons.person, color: Color(0xFF1B6E39)),
              ),
              title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('${c.phone}\n${c.address}'),
              isThreeLine: true,
              trailing: IconButton(
                icon: const Icon(Icons.edit, color: Colors.blue),
                onPressed: () => _openCustomerDialog(context, customer: c, index: idx),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ============================================================================
// 4. قسم الديون المستقل (متابعة الأرصدة - إضافة دين - تسديد دفعات)
// ============================================================================

class DebtsSection extends StatelessWidget {
  final List<CustomerModel> customers;
  final Function(int, double) onUpdateDebt;

  const DebtsSection({
    super.key,
    required this.customers,
    required this.onUpdateDebt,
  });

  void _showDebtActionDialog(BuildContext context, CustomerModel c, int idx, bool isAdding) {
    final amountCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: Text(isAdding ? 'إضافة دين جديد على: ${c.name}' : 'تسجيل تسديد دفعة من: ${c.name}'),
          content: TextField(
            controller: amountCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'المبلغ بالليرة TL', border: OutlineInputBorder()),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: isAdding ? Colors.red : Colors.green, foregroundColor: Colors.white),
              onPressed: () {
                final val = double.tryParse(amountCtrl.text.trim()) ?? 0.0;
                if (val > 0) {
                  double newTotal = isAdding ? (c.totalDebt + val) : (c.totalDebt - val);
                  if (newTotal < 0) newTotal = 0;
                  onUpdateDebt(idx, newTotal);
                  Navigator.pop(ctx);
                }
              },
              child: Text(isAdding ? 'إضافة للدين' : 'تسجيل كمسدد'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    double totalAllDebts = customers.fold(0.0, (sum, c) => sum + c.totalDebt);

    return Scaffold(
      appBar: AppBar(title: const Text('سجل الديون والذمم')),
      body: Column(
        children: [
          // لوحة إجمالي الديون في السوق
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: const Color(0xFFFEF3C7),
            child: Column(
              children: [
                const Text('إجمالي الديون المتبقية عند العملاء', style: TextStyle(color: Colors.brown)),
                const SizedBox(height: 4),
                Text(
                  '${totalAllDebts.toStringAsFixed(2)} TL',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.red),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: customers.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (ctx, idx) {
                final c = customers[idx];
                return Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(c.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            Text(
                              c.totalDebt > 0 ? '${c.totalDebt.toStringAsFixed(2)} TL' : 'خالص الذمة (0)',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: c.totalDebt > 0 ? Colors.red : Colors.green,
                              ),
                            ),
                          ],
                        ),
                        Text('هاتف: ${c.phone}', style: const TextStyle(color: Colors.grey)),
                        const Divider(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton.icon(
                              icon: const Icon(Icons.add_circle_outline, color: Colors.red, size: 18),
                              label: const Text('إضافة دين', style: TextStyle(color: Colors.red)),
                              onPressed: () => _showDebtActionDialog(context, c, idx, true),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                              icon: const Icon(Icons.check, size: 18),
                              label: const Text('تسديد دفعة'),
                              onPressed: () => _showDebtActionDialog(context, c, idx, false),
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
    );
  }
}

// ============================================================================
// 5. قسم ملصقات الشحن والطرود المستقل
// ============================================================================

class ShipmentsSection extends StatelessWidget {
  final List<ShipmentModel> shipments;
  final List<CustomerModel> customers;
  final Function(ShipmentModel) onAddShipment;
  final Function(int, String) onUpdateStatus;

  const ShipmentsSection({
    super.key,
    required this.shipments,
    required this.customers,
    required this.onAddShipment,
    required this.onUpdateStatus,
  });

  // تتبع Yurtiçi أونلاين
  Future<void> _trackYurtici(BuildContext context, String code) async {
    final url = Uri.parse('https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=$code');
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تعذر فتح صفحة التتبع')));
    }
  }

  // إرسال واتساب تم التسليم للزبون
  Future<void> _sendDeliveredWhatsApp(BuildContext context, ShipmentModel s) async {
    String phone = s.customerPhone.replaceAll(RegExp(r'[^0-9]'), '');
    if (phone.startsWith('05')) phone = '90${phone.substring(1)}';

    final text = '''
السلام عليكم ورحمة الله، أهلاً بك أخي *${s.customerName}* 🌿
يسرّنا إعلامك بأنه تم تسليم شحنتكم بنجاح من مناحلنا 🍯📦
بوليصة الشحن: ${s.trackingNumber}
نسعد دائماً بخدمتكم وبالهناء والعافية! ✨
''';

    final url = Uri.parse('https://wa.me/$phone?text=${Uri.encodeComponent(text)}');
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تعذر تشغيل تطبيق واتساب')));
    }
  }

  // إنشاء ملصق جديد مع فحص إذن الكاميرا لمسح الباركود
  void _createNewShipmentDialog(BuildContext context) async {
    CustomerModel? selectedCust = customers.isNotEmpty ? customers.first : null;
    final trackingCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            title: const Text('إنشاء ملصق شحنة جديد'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<CustomerModel>(
                    value: selectedCust,
                    decoration: const InputDecoration(labelText: 'اختر العميل', border: OutlineInputBorder()),
                    items: customers.map((c) => DropdownMenuItem(value: c, child: Text(c.name))).toList(),
                    onChanged: (v) => setDialogState(() => selectedCust = v),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: trackingCtrl,
                    decoration: InputDecoration(
                      labelText: 'رقم باركود الشحنة (Takip No)',
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.qr_code_scanner, color: Color(0xFF1B6E39)),
                        onPressed: () async {
                          // طلب إذن الكاميرا
                          PermissionStatus status = await Permission.camera.request();
                          if (status.isGranted) {
                            // محاكاة قراءة باركود بوليصة Yurtiçi
                            trackingCtrl.text = '9284719302';
                          }
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1B6E39), foregroundColor: Colors.white),
                onPressed: () {
                  if (selectedCust != null && trackingCtrl.text.isNotEmpty) {
                    onAddShipment(ShipmentModel(
                      id: 'SHP-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
                      invoiceId: '1042',
                      customerName: selectedCust!.name,
                      customerPhone: selectedCust!.phone,
                      address: selectedCust!.address,
                      cargoCompany: 'Yurtiçi Kargo',
                      trackingNumber: trackingCtrl.text.trim(),
                    ));
                    Navigator.pop(ctx);
                  }
                },
                child: const Text('حفظ الملصق والسجل'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('سجل وملصقات الشحن')),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF1B6E39),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.print),
        label: const Text('ملصق جديد'),
        onPressed: () => _createNewShipmentDialog(context),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: shipments.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (ctx, idx) {
          final s = shipments[idx];
          final isDelivered = s.status == 'تم التسليم';

          return Card(
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Chip(label: Text(s.cargoCompany), backgroundColor: const Color(0xFFFEF3C7)),
                      Chip(
                        label: Text(s.status),
                        backgroundColor: isDelivered ? Colors.green.shade100 : Colors.blue.shade100,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text('المستلم: ${s.customerName} (${s.customerPhone})', style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text('العنوان: ${s.address}', style: const TextStyle(color: Colors.grey)),
                  Text('باركود التتبع: ${s.trackingNumber}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  const Divider(),
                  Row(
                    children: [
                      OutlinedButton.icon(
                        icon: const Icon(Icons.travel_explore, size: 16),
                        label: const Text('تتبع Yurtiçi'),
                        onPressed: () => _trackYurtici(context, s.trackingNumber),
                      ),
                      const Spacer(),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                        icon: const Icon(Icons.send, size: 16),
                        label: const Text('واتساب التسليم'),
                        onPressed: () {
                          onUpdateStatus(idx, 'تم التسليم');
                          _sendDeliveredWhatsApp(context, s);
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
    );
  }
}

// ============================================================================
// 6. قسم الفواتير المستقل (عرض الفاتورة وتعديل أخطائها)
// ============================================================================

class InvoicesSection extends StatelessWidget {
  final List<InvoiceModel> invoices;
  final Function(InvoiceModel, int) onUpdateInvoice;

  const InvoicesSection({
    super.key,
    required this.invoices,
    required this.onUpdateInvoice,
  });

  void _editInvoiceDialog(BuildContext context, InvoiceModel inv, int idx) {
    final nameCtrl = TextEditingController(text: inv.customerName);
    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: Text('تعديل خطأ بالفاتورة #${inv.id}'),
          content: TextField(
            controller: nameCtrl,
            decoration: const InputDecoration(labelText: 'اسم الزبون في الفاتورة', border: OutlineInputBorder()),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1B6E39), foregroundColor: Colors.white),
              onPressed: () {
                inv.customerName = nameCtrl.text.trim();
                onUpdateInvoice(inv, idx);
                Navigator.pop(ctx);
              },
              child: const Text('حفظ التعديل'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('قائمة الفواتير')),
      body: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: invoices.length,
        itemBuilder: (ctx, idx) {
          final inv = invoices[idx];
          return Card(
            elevation: 2,
            child: ListTile(
              title: Text('فاتورة #${inv.id} - ${inv.customerName}', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('الإجمالي: ${inv.grandTotal.toStringAsFixed(2)} TL'),
              trailing: IconButton(
                icon: const Icon(Icons.edit, color: Colors.blue),
                onPressed: () => _editInvoiceDialog(context, inv, idx),
              ),
            ),
          );
        },
      ),
    );
  }
}

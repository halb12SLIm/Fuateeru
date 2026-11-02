import 'package:flutter/material.dart';
import 'customer.dart';
import 'edit_customer_screen.dart';

class FirebaseCustomerService {
  static Future<void> updateCustomerInFirestore(Customer updatedCustomer) async {
    try {
      // استدعاء التحديث الخاص بـ Firestore:
      // await FirebaseFirestore.instance
      //     .collection('customers')
      //     .doc(updatedCustomer.id)
      //     .update(updatedCustomer.toMap());
    } catch (e) {
      debugPrint('Firestore update error: $e');
    }
  }
}

class CustomersListScreen extends StatefulWidget {
  const CustomersListScreen({super.key});

  @override
  State<CustomersListScreen> createState() => _CustomersListScreenState();
}

class _CustomersListScreenState extends State<CustomersListScreen> {
  // قائمة بيانات تجريبية للعملاء
  List<Customer> customers = [
    Customer(
      id: '1',
      name: 'محمد العلي',
      phone: '05551234567',
      address: 'إسطنبول - الفاتح',
      notes: 'يفضل الشحن عبر Yurtiçi',
    ),
    Customer(
      id: '2',
      name: 'أحمد محمود',
      phone: '05339876543',
      address: 'أنطاليا - مراد باشا',
      notes: 'دفع عند الاستلام',
    ),
    Customer(
      id: '3',
      name: 'خالد السليم',
      phone: '05051112233',
      address: 'بورصة - نيلوفر',
      notes: 'عميل مميز - خصم 5%',
    ),
  ];

  // فتح شاشة التعديل واستلام النتيجة المحدثة
  Future<void> _navigateToEdit(Customer customer, int index) async {
    final updatedCustomer = await Navigator.push<Customer>(
      context,
      MaterialPageRoute(
        builder: (context) => EditCustomerScreen(customer: customer),
      ),
    );

    if (updatedCustomer != null) {
      setState(() {
        customers[index] = updatedCustomer;
      });

      await FirebaseCustomerService.updateCustomerInFirestore(updatedCustomer);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم تحديث بيانات العميل بنجاح'),
            backgroundColor: Color(0xFF1B6E39),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
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
            'قائمة العملاء',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
        ),
        body: customers.isEmpty
            ? const Center(
                child: Text(
                  'لا يوجد عملاء حالياً',
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: customers.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final customer = customers[index];
                  return Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade200),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            backgroundColor: const Color(0xFF1B6E39).withOpacity(0.1),
                            child: Text(
                              customer.name.isNotEmpty ? customer.name[0] : '?',
                              style: const TextStyle(
                                color: Color(0xFF1B6E39),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  customer.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    const Icon(Icons.phone_outlined, size: 16, color: Colors.grey),
                                    const SizedBox(width: 6),
                                    Text(
                                      customer.phone,
                                      style: TextStyle(color: Colors.grey.shade700),
                                    ),
                                  ],
                                ),
                                if (customer.address.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(Icons.location_on_outlined, size: 16, color: Colors.grey),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          customer.address,
                                          style: TextStyle(color: Colors.grey.shade700),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                                if (customer.notes.isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.amber.shade50,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: Colors.amber.shade200),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.note_alt_outlined, size: 14, color: Colors.amber.shade900),
                                        const SizedBox(width: 4),
                                        Flexible(
                                          child: Text(
                                            customer.notes,
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.amber.shade900,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          // زر التعديل كما في السنيبت المطلوب
                          IconButton(
                            icon: const Icon(Icons.edit, color: Colors.blueAccent),
                            onPressed: () => _navigateToEdit(customer, index),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

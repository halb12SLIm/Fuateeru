import 'package:flutter/material.dart';
import 'invoice_model.dart';
import 'invoice_form_screen.dart';

class FirebaseInvoiceService {
  static Future<void> updateInvoiceInFirestore(Invoice updatedInvoice) async {
    try {
      // استدعاء التحديث الخاص بـ Firestore:
      // await FirebaseFirestore.instance
      //     .collection('invoices')
      //     .doc(updatedInvoice.id)
      //     .update(updatedInvoice.toMap());
    } catch (e) {
      debugPrint('Firestore update error: $e');
    }
  }
}

class InvoicesListScreen extends StatefulWidget {
  const InvoicesListScreen({super.key});

  @override
  State<InvoicesListScreen> createState() => _InvoicesListScreenState();
}

class _InvoicesListScreenState extends State<InvoicesListScreen> {
  // قائمة الفواتير التجريبية
  List<Invoice> invoices = [
    Invoice(
      id: 'INV-1001',
      customerName: 'محمد العلي',
      customerPhone: '05551234567',
      date: DateTime.now().subtract(const Duration(days: 1)),
      items: [
        InvoiceItem(name: 'عسل سدر فاخر', quantity: 2, unitPrice: 250),
        InvoiceItem(name: 'شمع عسل طبيعي', quantity: 1, unitPrice: 100),
      ],
      notes: 'شحن عبر Yurtiçi',
    ),
    Invoice(
      id: 'INV-1002',
      customerName: 'أحمد محمود',
      customerPhone: '05339876543',
      date: DateTime.now(),
      items: [
        InvoiceItem(name: 'عسل حبة البركة', quantity: 3, unitPrice: 180),
      ],
      notes: 'دفع عند الاستلام',
    ),
  ];

  // استدعاء شاشة التعديل وتمرير الفاتورة القديمة
  void _editInvoice(Invoice invoice, int index) async {
    final updatedInvoice = await Navigator.push<Invoice>(
      context,
      MaterialPageRoute(
        builder: (context) => InvoiceFormScreen(invoice: invoice), // نمرر الفاتورة القديمة هنا
      ),
    );

    if (updatedInvoice != null) {
      setState(() {
        // نحدّث الفاتورة في مكانها القديم بالقائمة
        invoices[index] = updatedInvoice;
      });

      // تحديث البيانات في Cloud Firestore
      await FirebaseInvoiceService.updateInvoiceInFirestore(updatedInvoice);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم تصحيح وتعديل الفاتورة بنجاح'),
            backgroundColor: Color(0xFF1B6E39),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  // إضافة فاتورة جديدة
  void _addNewInvoice() async {
    final newInvoice = await Navigator.push<Invoice>(
      context,
      MaterialPageRoute(
        builder: (context) => const InvoiceFormScreen(),
      ),
    );

    if (newInvoice != null) {
      setState(() {
        invoices.insert(0, newInvoice);
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تمت إضافة الفاتورة بنجاح'),
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
            'سجل الفواتير',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
        ),
        floatingActionButton: FloatingActionButton.extended(
          backgroundColor: const Color(0xFF1B6E39),
          foregroundColor: Colors.white,
          onPressed: _addNewInvoice,
          icon: const Icon(Icons.add),
          label: const Text('فاتورة جديدة'),
        ),
        body: invoices.isEmpty
            ? const Center(
                child: Text(
                  'لا توجد فواتير حالياً',
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: invoices.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final invoice = invoices[index];
                  return Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade200),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF1B6E39).withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      invoice.id,
                                      style: const TextStyle(
                                        color: Color(0xFF1B6E39),
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    invoice.customerName,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),
                              IconButton(
                                icon: const Icon(Icons.edit, color: Colors.blueAccent),
                                tooltip: 'تعديل',
                                onPressed: () => _editInvoice(invoice, index),
                              ),
                            ],
                          ),
                          const Divider(height: 20),
                          ...invoice.items.map(
                            (item) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 2),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('• ${item.name} (${item.quantity} × ${item.unitPrice})'),
                                  Text(
                                    '${item.totalPrice.toStringAsFixed(2)}',
                                    style: TextStyle(color: Colors.grey.shade700),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const Divider(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'التاريخ: ${invoice.date.year}/${invoice.date.month}/${invoice.date.day}',
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                              Text(
                                'المجموع: ${invoice.totalAmount.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1B6E39),
                                ),
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
    );
  }
}

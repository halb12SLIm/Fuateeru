import 'package:flutter/material.dart';
import 'invoice_model.dart';

class InvoiceFormScreen extends StatefulWidget {
  final Invoice? invoice; // إذا كانت موجودة، فنحن نعدل؛ وإلا فنحن ننشئ جديدة

  const InvoiceFormScreen({super.key, this.invoice});

  @override
  State<InvoiceFormScreen> createState() => _InvoiceFormScreenState();
}

class _InvoiceFormScreenState extends State<InvoiceFormScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _customerNameController;
  late TextEditingController _customerPhoneController;
  late TextEditingController _notesController;

  List<InvoiceItem> _items = [];

  bool get isEditing => widget.invoice != null;

  @override
  void initState() {
    super.initState();
    // إذا كنا في وضع التعديل، نقرأ البيانات القديمة للفاتورة
    _customerNameController =
        TextEditingController(text: widget.invoice?.customerName ?? '');
    _customerPhoneController =
        TextEditingController(text: widget.invoice?.customerPhone ?? '');
    _notesController =
        TextEditingController(text: widget.invoice?.notes ?? '');

    if (isEditing) {
      // نأخذ نسخة من الأصناف حتى نستطيع التعديل عليها دون تشويه البيانات الأصلية فوراً
      _items = widget.invoice!.items
          .map((item) => InvoiceItem(
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              ))
          .toList();
    }
  }

  @override
  void dispose() {
    _customerNameController.dispose();
    _customerPhoneController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  // إضافة صنف جديد للفاتورة أو تعديله
  void _showItemDialog({InvoiceItem? itemToEdit, int? index}) {
    final nameCtrl = TextEditingController(text: itemToEdit?.name ?? '');
    final qtyCtrl =
        TextEditingController(text: itemToEdit?.quantity.toString() ?? '1');
    final priceCtrl =
        TextEditingController(text: itemToEdit?.unitPrice.toString() ?? '');

    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: Text(itemToEdit == null ? 'إضافة صنف' : 'تعديل الصنف'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'اسم المادة / الصنف',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: qtyCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'الكمية (كغ / عبوة)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: priceCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'سعر الوحدة',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1B6E39),
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                final name = nameCtrl.text.trim();
                final qty = double.tryParse(qtyCtrl.text.trim()) ?? 1.0;
                final price = double.tryParse(priceCtrl.text.trim()) ?? 0.0;

                if (name.isNotEmpty && price > 0) {
                  setState(() {
                    if (itemToEdit != null && index != null) {
                      // تعديل صنف موجود في الفاتورة
                      _items[index] = InvoiceItem(name: name, quantity: qty, unitPrice: price);
                    } else {
                      // إضافة صنف جديد
                      _items.add(InvoiceItem(name: name, quantity: qty, unitPrice: price));
                    }
                  });
                  Navigator.pop(ctx);
                }
              },
              child: const Text('حفظ الصنف'),
            ),
          ],
        ),
      ),
    );
  }

  void _saveInvoice() {
    if (!_formKey.currentState!.validate()) return;
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('يرجى إضافة صنف واحد على الأقل للفاتورة'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    final invoiceResult = Invoice(
      id: widget.invoice?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
      customerName: _customerNameController.text.trim(),
      customerPhone: _customerPhoneController.text.trim(),
      date: widget.invoice?.date ?? DateTime.now(),
      items: _items,
      notes: _notesController.text.trim(),
    );

    // إعادة الفاتورة المعدلة أو الجديدة للشاشة السابقة
    Navigator.pop(context, invoiceResult);
  }

  @override
  Widget build(BuildContext context) {
    double total = _items.fold(0.0, (sum, item) => sum + item.totalPrice);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: const Color(0xFF1B6E39),
          elevation: 0,
          title: Text(
            isEditing ? 'تعديل الفاتورة' : 'إنشاء فاتورة جديدة',
            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.check, color: Colors.white),
              tooltip: 'حفظ التغييرات',
              onPressed: _saveInvoice,
            ),
          ],
        ),
        body: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // معلومات الزبون
              TextFormField(
                controller: _customerNameController,
                decoration: const InputDecoration(
                  labelText: 'اسم الزبون',
                  prefixIcon: Icon(Icons.person),
                  border: OutlineInputBorder(),
                ),
                validator: (val) => val == null || val.isEmpty ? 'مطلوب' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _customerPhoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'رقم الهاتف',
                  prefixIcon: Icon(Icons.phone),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              const Divider(),

              // قائمة البضائع والأسعار
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'أصناف الفاتورة',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1B6E39),
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('إضافة مادة'),
                    onPressed: () => _showItemDialog(),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // قائمة الأصناف الحالية مع أزرار التعديل والحذف
              if (_items.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Text(
                      'لا توجد أصناف في الفاتورة بعد',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                )
              else
                ..._items.asMap().entries.map((entry) {
                  int idx = entry.key;
                  InvoiceItem item = entry.value;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                      side: BorderSide(color: Colors.grey.shade200),
                    ),
                    child: ListTile(
                      title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('الكمية: ${item.quantity} × السعر: ${item.unitPrice}'),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            item.totalPrice.toStringAsFixed(2),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: Color(0xFF1B6E39),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // تعديل الصنف نفسه داخل الفاتورة
                          IconButton(
                            icon: const Icon(Icons.edit, color: Colors.blue, size: 20),
                            onPressed: () => _showItemDialog(itemToEdit: item, index: idx),
                          ),
                          // حذف الصنف
                          IconButton(
                            icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                            onPressed: () {
                              setState(() {
                                _items.removeAt(idx);
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                }),

              const Divider(height: 32),

              // الملاحظات
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'ملاحظات (طريقة الشحن / الدفع...)',
                  prefixIcon: Icon(Icons.note),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 20),

              // المجموع وزر الحفظ
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1B6E39).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF1B6E39).withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('الإجمالي العام:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    Text(
                      total.toStringAsFixed(2),
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1B6E39)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1B6E39),
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(50),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                onPressed: _saveInvoice,
                child: Text(
                  isEditing ? 'تثبيت التعديل على الفاتورة' : 'حفظ الفاتورة',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class InvoiceItem {
  String name;      // اسم الصنف (مثل: عسل سدر، زهور...)
  double quantity;  // الكمية / الوزن بالكيلو
  double unitPrice; // سعر الكيلو أو القطعة

  InvoiceItem({
    required this.name,
    required this.quantity,
    required this.unitPrice,
  });

  double get totalPrice => quantity * unitPrice;

  Map<String, dynamic> toMap() => {
    'name': name,
    'quantity': quantity,
    'unitPrice': unitPrice,
  };

  factory InvoiceItem.fromMap(Map<String, dynamic> map) => InvoiceItem(
    name: map['name'] ?? '',
    quantity: (map['quantity'] as num?)?.toDouble() ?? 0.0,
    unitPrice: (map['unitPrice'] as num?)?.toDouble() ?? 0.0,
  );
}

class Invoice {
  final String id;
  String customerName;
  String customerPhone;
  DateTime date;
  List<InvoiceItem> items;
  String notes;

  Invoice({
    required this.id,
    required this.customerName,
    required this.customerPhone,
    required this.date,
    required this.items,
    this.notes = '',
  });

  double get totalAmount => items.fold(0.0, (sum, item) => sum + item.totalPrice);

  Map<String, dynamic> toMap() => {
    'id': id,
    'customerName': customerName,
    'customerPhone': customerPhone,
    'date': date.toIso8601String(),
    'items': items.map((e) => e.toMap()).toList(),
    'notes': notes,
    'totalAmount': totalAmount,
  };

  factory Invoice.fromMap(Map<String, dynamic> map) => Invoice(
    id: map['id'] ?? '',
    customerName: map['customerName'] ?? '',
    customerPhone: map['customerPhone'] ?? '',
    date: DateTime.tryParse(map['date'] ?? '') ?? DateTime.now(),
    items: (map['items'] as List<dynamic>?)
            ?.map((item) => InvoiceItem.fromMap(item as Map<String, dynamic>))
            .toList() ??
        [],
    notes: map['notes'] ?? '',
  );
}

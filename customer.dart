class Customer {
  final String id;
  String name;
  String phone;
  String address;
  String notes;

  Customer({
    required this.id,
    required this.name,
    required this.phone,
    required this.address,
    this.notes = '',
  });

  /// تحويل كائن العميل إلى Map لتخزينه في Firestore أو SQLite
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'address': address,
      'notes': notes,
    };
  }

  /// إنشاء كائن عميل من Map مسترجعة من Firestore أو SQLite
  factory Customer.fromMap(Map<String, dynamic> map) {
    return Customer(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      phone: map['phone'] ?? '',
      address: map['address'] ?? '',
      notes: map['notes'] ?? '',
    );
  }

  /// نسخ الكائن مع تعديل بعض القيم (copyWith)
  Customer copyWith({
    String? id,
    String? name,
    String? phone,
    String? address,
    String? notes,
  }) {
    return Customer(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      notes: notes ?? this.notes,
    );
  }
}

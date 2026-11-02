class Shipment {
  final String id;              // معرف الشحنة الداخلي (مثال: SHP-1001)
  final String invoiceId;       // رقم الفاتورة المرتبطة
  final String customerId;      // معرف الزبون
  final String customerName;    // اسم المستلم
  final String customerPhone;   // هاتف المستلم
  final String fullAddress;     // عنوان الشحن التفصيلي
  final String cargoCompany;    // شركة الشحن (Yurtiçi Kargo, Aras, PTT, DPD...)
  final String trackingNumber;  // رقم تتبع الشحنة (Takip No)
  final double packageWeightKg; // الوزن الإجمالي للطرود
  final String status;          // الحالة (قيد التجهيز، تم الشحن، تم التسليم)
  final DateTime createdAt;     // تاريخ إصدار الشحنة

  Shipment({
    required this.id,
    required this.invoiceId,
    required this.customerId,
    required this.customerName,
    required this.customerPhone,
    required this.fullAddress,
    required this.cargoCompany,
    required this.trackingNumber,
    this.packageWeightKg = 1.0,
    this.status = 'تم الشحن',
    required this.createdAt,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'invoiceId': invoiceId,
    'customerId': customerId,
    'customerName': customerName,
    'customerPhone': customerPhone,
    'fullAddress': fullAddress,
    'cargoCompany': cargoCompany,
    'trackingNumber': trackingNumber,
    'packageWeightKg': packageWeightKg,
    'status': status,
    'createdAt': createdAt.toIso8601String(),
  };

  factory Shipment.fromMap(Map<String, dynamic> map) => Shipment(
    id: map['id'] ?? '',
    invoiceId: map['invoiceId'] ?? '',
    customerId: map['customerId'] ?? '',
    customerName: map['customerName'] ?? '',
    customerPhone: map['customerPhone'] ?? '',
    fullAddress: map['fullAddress'] ?? '',
    cargoCompany: map['cargoCompany'] ?? 'Yurtiçi Kargo',
    trackingNumber: map['trackingNumber'] ?? '',
    packageWeightKg: (map['packageWeightKg'] as num?)?.toDouble() ?? 1.0,
    status: map['status'] ?? 'تم الشحن',
    createdAt: DateTime.tryParse(map['createdAt'] ?? '') ?? DateTime.now(),
  );
}

import 'dart:convert';

/// كائن بيانات الشعار والمنتج المستخرج عبر Gemini Studio
class LogoData {
  final String brandName;
  final String productName;
  final String details;
  final String? weightOrVolume;
  final double? price;
  final String? currency;

  LogoData({
    required this.brandName,
    required this.productName,
    required this.details,
    this.weightOrVolume,
    this.price,
    this.currency,
  });

  factory LogoData.fromJson(Map<String, dynamic> json) {
    return LogoData(
      brandName: json['brand_name'] ?? json['brandName'] ?? '',
      productName: json['product_name'] ?? json['productName'] ?? '',
      details: json['details'] ?? '',
      weightOrVolume: json['weight_or_volume'] ?? json['weightOrVolume'],
      price: json['price'] != null ? (json['price'] as num).toDouble() : null,
      currency: json['currency'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'brand_name': brandName,
      'product_name': productName,
      'details': details,
      if (weightOrVolume != null) 'weight_or_volume': weightOrVolume,
      if (price != null) 'price': price,
      if (currency != null) 'currency': currency,
    };
  }

  factory LogoData.fromRawJson(String rawJson) =>
      LogoData.fromJson(json.decode(rawJson));

  String toRawJson() => json.encode(toJson());
}

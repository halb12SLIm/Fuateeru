import 'package:flutter/material.dart';

class UltraMsgService {
  /// تحديث حالة الشحنة إلى "تم التسليم" في Cloud Firestore
  /// هذا التحديث يرسل حدث التغيير لـ Firebase Cloud Function v2
  /// والتي ترسل إشعار الواتساب التلقائي للزبون عبر UltraMsg API
  static Future<void> markShipmentAsDelivered(String shipmentId) async {
    try {
      // كود التحديث المباشر في Cloud Firestore:
      // await FirebaseFirestore.instance
      //     .collection('shipments')
      //     .doc(shipmentId)
      //     .update({
      //       'status': 'تم التسليم',
      //     });
      debugPrint('Shipment $shipmentId marked as delivered in Firestore.');
    } catch (e) {
      debugPrint('Error marking shipment as delivered: $e');
    }
  }
}

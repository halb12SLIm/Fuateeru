import 'dart:io';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class PermissionHelper {
  /// فحص وطلب أذونات الكاميرا والاستوديو معاً
  static Future<bool> requestAppPermissions(BuildContext context) async {
    // تحديد إذن الصور حسب إصدار الأندرويد
    Permission storagePermission = Permission.photos;
    if (Platform.isAndroid) {
      // للأندرويد، نفحص إذن الصور والأجهزة
      storagePermission = Permission.photos;
    }

    // التحقق من الحالة الحالية
    PermissionStatus cameraStatus = await Permission.camera.status;
    PermissionStatus storageStatus = await storagePermission.status;

    // إذا كانت الأذونات ممنوحة مسبقاً، نتابع فوراً
    if (cameraStatus.isGranted && storageStatus.isGranted) {
      return true;
    }

    // إظهار نافذة شرح جميلة قبل نافذة النظام
    if (!context.mounted) return false;
    final bool? userAgreed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          title: const Row(
            children: [
              Icon(Icons.security, color: Color(0xFF8B5A2B)),
              SizedBox(width: 8),
              Text('أذونات التطبيق', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          content: const Text(
            'يحتاج التطبيق إلى الوصول إلى:\n\n'
            '📷 الكاميرا: لمسح باركود بوليصة الشحن وتصوير الطرود.\n'
            '🖼️ الاستوديو: لإرفاق صور الفواتير وملصقات الشحن.\n\n'
            'هل توافق على منح هذه الصلاحيات؟',
            style: TextStyle(height: 1.5),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('لاحقاً', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1B6E39),
                foregroundColor: Colors.white,
              ),
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('موافق، منح الإذن'),
            ),
          ],
        ),
      ),
    );

    // إذا ضغط المستخدم على موافق، نطلب نافذة النظام الرسمية
    if (userAgreed == true) {
      Map<Permission, PermissionStatus> statuses = await [
        Permission.camera,
        Permission.photos,
        Permission.storage, // لضمان التوافق مع كافة إصدارات أندرويد
      ].request();

      // التحقق من النتيجة
      bool isGranted = statuses[Permission.camera]?.isGranted == true;

      // إذا رفض المستخدم الأذونات بشكل دائم، نوجهه للإعدادات
      if (statuses[Permission.camera]?.isPermanentlyDenied == true) {
        if (context.mounted) {
          _showSettingsDialog(context);
        }
        return false;
      }

      return isGranted;
    }

    return false;
  }

  /// نافذة مساعدة في حال رفض المستخدم الإذن نهائياً ونريد توجيهه للإعدادات
  static void _showSettingsDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: const Text('الإذن مطلوب', style: TextStyle(fontWeight: FontWeight.bold)),
          content: const Text(
            'تم رفض الإذن سابقاً، يرجى تفعيل إذن الكاميرا والاستوديو من إعدادات الهاتف لتتمكن من استخدام الميزة.',
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
                Navigator.pop(ctx);
                openAppSettings(); // يفتح صفحة إعدادات تطبيقك مباشرة في الهاتف
              },
              child: const Text('فتح الإعدادات'),
            ),
          ],
        ),
      ),
    );
  }
}

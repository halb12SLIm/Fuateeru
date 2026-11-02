import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LogoStorageService {
  static const String _keyLogoPath = 'saved_brand_logo_path';

  /// استرجاع مسار اللوجو المحفوظ مسبقاً
  static Future<String?> getSavedLogoPath() async {
    final prefs = await SharedPreferences.getInstance();
    final String? path = prefs.getString(_keyLogoPath);

    // التأكد من أن ملف الصورة لا يزال موجوداً في الهاتف
    if (path != null && await File(path).exists()) {
      return path;
    }
    return null;
  }

  /// اختيار صورة من الاستوديو وحفظها بشكل دائم في التطبيق
  static Future<String?> pickAndSavePermanentLogo() async {
    final ImagePicker picker = ImagePicker();
    final XFile? pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85, // ضغط مناسب للطباعة السريعة
    );

    if (pickedFile == null) return null;

    // الحصول على مسار المستندات الداخلي للتطبيق
    final directory = await getApplicationDocumentsDirectory();
    final String permanentPath = '${directory.path}/company_logo.png';

    // نسخ الصورة المختارة إلى المجلد الدائم للتطبيق
    final File savedFile = await File(pickedFile.path).copy(permanentPath);

    // حفظ المسار في SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyLogoPath, savedFile.path);

    return savedFile.path;
  }

  /// حذف اللوجو إذا أردت إزالته تماماً
  static Future<void> clearLogo() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyLogoPath);
  }
}

import 'package:flutter/material.dart';
import 'permission_helper.dart';

/// الشاشة الرئيسية لتطبيق شركة سليم مع شريط علوي وقائمة خدمات سريعة جانبية (FeaturesDrawer)
class HomeScreen extends StatefulWidget {
  final String accountCode;
  final VoidCallback? onScanAI;
  final VoidCallback? onShippingLabel;
  final VoidCallback? onDataEntry;
  final VoidCallback? onLogoScanner;
  final VoidCallback? onLinkDevice;

  const HomeScreen({
    super.key,
    this.accountCode = 'SLM-JEZLD',
    this.onScanAI,
    this.onShippingLabel,
    this.onDataEntry,
    this.onLogoScanner,
    this.onLinkDevice,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // تظهر الرسالة تلقائياً عند أول فتح للتطبيق
      PermissionHelper.requestAppPermissions(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    // تحديد اتجاه التطبيق من اليمين لليسار (RTL)
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: const Color(0xFF1B6E39), // نفس اللون الأخضر الخاص بالتطبيق
          elevation: 0,
          title: Row(
            children: [
              // الشعار والنصوص العلوية
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF8B5A2B), width: 2),
                ),
                child: const Icon(Icons.hexagon_outlined, color: Color(0xFF8B5A2B), size: 24),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'شركة سليم',
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    widget.accountCode,
                    style: const TextStyle(color: Colors.white70, fontSize: 11, letterSpacing: 1.2),
                  ),
                ],
              ),
            ],
          ),
          // زر الإعدادات لفتح الميزات من جهة اليمين
          actions: [
            Builder(
              builder: (context) => IconButton(
                icon: const Icon(Icons.settings, color: Colors.white, size: 26),
                tooltip: 'الميزات والإعدادات',
                onPressed: () {
                  // فتح القائمة الجانبية من اليمين
                  Scaffold.of(context).openEndDrawer();
                },
              ),
            ),
            const SizedBox(width: 8),
          ],
        ),

        // القائمة الجانبية التي تظهر من جهة اليمين عند الضغط على الإعدادات
        endDrawer: FeaturesDrawer(
          onScanAI: widget.onScanAI,
          onShippingLabel: widget.onShippingLabel,
          onDataEntry: widget.onDataEntry,
          onLogoScanner: widget.onLogoScanner,
          onLinkDevice: widget.onLinkDevice,
        ),

        body: Container(
          color: const Color(0xFFFBFBEE),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF8B5A2B), width: 2),
                  ),
                  child: const Icon(Icons.hexagon_outlined, color: Color(0xFF8B5A2B), size: 48),
                ),
                const SizedBox(height: 16),
                const Text(
                  'شركة سليم لإنتاج العسل الطبيعي',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1B6E39)),
                ),
                const SizedBox(height: 8),
                const Text(
                  'اضغط على أيقونة الإعدادات العلوية لفتح قائمة الخدمات السريعة',
                  style: TextStyle(fontSize: 13, color: Colors.black54),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// ويدجت القائمة الجانبية التي تحتوي على الأزرار الملونة الخمسة
class FeaturesDrawer extends StatelessWidget {
  final VoidCallback? onScanAI;
  final VoidCallback? onShippingLabel;
  final VoidCallback? onDataEntry;
  final VoidCallback? onLogoScanner;
  final VoidCallback? onLinkDevice;

  const FeaturesDrawer({
    super.key,
    this.onScanAI,
    this.onShippingLabel,
    this.onDataEntry,
    this.onLogoScanner,
    this.onLinkDevice,
  });

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: const Color(0xFF14532D), // خلفية خضراء داكنة متناسقة
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // رأس القائمة الجانبية
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20.0),
              color: const Color(0xFF0F3E22),
              child: Row(
                children: const [
                  Icon(Icons.tune, color: Colors.white, size: 22),
                  SizedBox(width: 10),
                  Text(
                    'قائمة الخدمات السريعة',
                    style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // البطاقات الملونة
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  // 1. مسح AI
                  _buildFeatureCard(
                    title: 'مسح AI',
                    icon: Icons.camera_alt_outlined,
                    bgColor: const Color(0xFF0088CC),
                    onTap: () {
                      Navigator.pop(context); // إغلاق القائمة
                      if (onScanAI != null) {
                        onScanAI!();
                      }
                    },
                  ),
                  const SizedBox(height: 12),

                  // 2. ملصق شحن
                  _buildFeatureCard(
                    title: 'ملصق شحن',
                    icon: Icons.local_shipping_outlined,
                    bgColor: const Color(0xFFF58220),
                    onTap: () {
                      Navigator.pop(context);
                      if (onShippingLabel != null) {
                        onShippingLabel!();
                      }
                    },
                  ),
                  const SizedBox(height: 12),

                  // 3. إدخال البيانات
                  _buildFeatureCard(
                    title: 'إدخال البيانات',
                    icon: Icons.description_outlined,
                    bgColor: const Color(0xFF009EE2),
                    onTap: () {
                      Navigator.pop(context);
                      if (onDataEntry != null) {
                        onDataEntry!();
                      }
                    },
                  ),
                  const SizedBox(height: 12),

                  // 4. فحص الشعار
                  _buildFeatureCard(
                    title: 'فحص الشعار',
                    icon: Icons.auto_awesome,
                    bgColor: const Color(0xFF4A3AFF),
                    onTap: () {
                      Navigator.pop(context);
                      if (onLogoScanner != null) {
                        onLogoScanner!();
                      }
                    },
                  ),
                  const SizedBox(height: 12),

                  // 5. ربط هاتف آخر
                  _buildFeatureCard(
                    title: 'ربط هاتف آخر',
                    icon: Icons.stay_current_portrait_outlined,
                    bgColor: const Color(0xFF00A86B),
                    onTap: () {
                      Navigator.pop(context);
                      if (onLinkDevice != null) {
                        onLinkDevice!();
                      }
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // دالة بناء كل بطاقة خدمة بنفس الستايل والانحناءات وظلال الألوان
  Widget _buildFeatureCard({
    required String title,
    required IconData icon,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 64,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.18),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            Icon(icon, color: Colors.white, size: 24),
          ],
        ),
      ),
    );
  }
}

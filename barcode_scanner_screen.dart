import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class BarcodeScannerScreen extends StatefulWidget {
  const BarcodeScannerScreen({super.key});

  @override
  State<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends State<BarcodeScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates, // يمنع تكرار المسح لنفس الباركود
  );

  bool _isScanned = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
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
            'مسح باركود شحنة Yurtiçi',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
          actions: [
            // زر تشغيل الفلاش في حال كانت الإضاءة ضعيفة
            IconButton(
              icon: const Icon(Icons.flash_on, color: Colors.white),
              onPressed: () => _controller.toggleTorch(),
            ),
          ],
        ),
        body: Stack(
          alignment: Alignment.center,
          children: [
            // عارض الكاميرا
            MobileScanner(
              controller: _controller,
              onDetect: (capture) {
                if (_isScanned) return;

                final List<Barcode> barcodes = capture.barcodes;
                for (final barcode in barcodes) {
                  final String? code = barcode.rawValue;
                  if (code != null && code.isNotEmpty) {
                    _isScanned = true;
                    // إعادة رقم الباركود فور التقاطه
                    Navigator.pop(context, code);
                    break;
                  }
                }
              },
            ),

            // إطار توجيهي للمستخدم لوضع الباركود داخله
            Container(
              width: 280,
              height: 140,
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFF8B5A2B), width: 3),
                borderRadius: BorderRadius.circular(12),
              ),
            ),

            Positioned(
              bottom: 40,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'وجّه الكاميرا نحو باركود بوليصة الشحن',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

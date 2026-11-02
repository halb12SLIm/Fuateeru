import 'dart:io';
import 'package:flutter/material.dart';
import 'logo_storage_service.dart';

class ShippingLabelLogoWidget extends StatefulWidget {
  final ValueChanged<String?>? onLogoChanged;

  const ShippingLabelLogoWidget({
    super.key,
    this.onLogoChanged,
  });

  @override
  State<ShippingLabelLogoWidget> createState() => _ShippingLabelLogoWidgetState();
}

class _ShippingLabelLogoWidgetState extends State<ShippingLabelLogoWidget> {
  String? _logoPath;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSavedLogo();
  }

  Future<void> _loadSavedLogo() async {
    final path = await LogoStorageService.getSavedLogoPath();
    if (mounted) {
      setState(() {
        _logoPath = path;
        _isLoading = false;
      });
      if (widget.onLogoChanged != null) {
        widget.onLogoChanged!(_logoPath);
      }
    }
  }

  Future<void> _pickNewLogo() async {
    setState(() => _isLoading = true);
    final newPath = await LogoStorageService.pickAndSavePermanentLogo();
    if (mounted) {
      setState(() {
        _logoPath = newPath;
        _isLoading = false;
      });
      if (widget.onLogoChanged != null) {
        widget.onLogoChanged!(_logoPath);
      }
      if (newPath != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم حفظ لوجو الشركة الدائم بنجاح 🖼️'),
            backgroundColor: Color(0xFF1B6E39),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _clearLogo() async {
    await LogoStorageService.clearLogo();
    if (mounted) {
      setState(() {
        _logoPath = null;
      });
      if (widget.onLogoChanged != null) {
        widget.onLogoChanged!(null);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const SizedBox(
        height: 80,
        child: Center(
          child: CircularProgressIndicator(color: Color(0xFF1B6E39)),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'شعار الشركة في ملصق الشحن',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            if (_logoPath != null)
              TextButton.icon(
                style: TextButton.styleFrom(foregroundColor: Colors.red),
                icon: const Icon(Icons.delete_outline, size: 16),
                label: const Text('إزالة الشعار', style: TextStyle(fontSize: 11)),
                onPressed: _clearLogo,
              ),
          ],
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: _pickNewLogo,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            height: 90,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: _logoPath != null ? const Color(0xFF1B6E39) : Colors.grey.shade300,
                width: _logoPath != null ? 1.5 : 1,
              ),
            ),
            child: _logoPath != null
                ? Row(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.file(
                            File(_logoPath!),
                            height: 74,
                            width: 74,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              'لوجو الشركة الدائم مفعّل 🟢',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF1B6E39)),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'سيظهر في أعلى كافة الملصقات الحرارية والفواتير',
                              style: TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10),
                        child: Icon(Icons.edit_outlined, color: Color(0xFF8B5A2B), size: 20),
                      ),
                    ],
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.add_photo_alternate_outlined, color: Color(0xFF8B5A2B), size: 28),
                      SizedBox(width: 8),
                      Text(
                        'إضافة شعار / لوجو الشركة الدائم',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF8B5A2B),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}

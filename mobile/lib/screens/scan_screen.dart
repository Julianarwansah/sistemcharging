import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../providers/station_provider.dart';

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final MobileScannerController _scannerCtrl = MobileScannerController();
  bool _isProcessing = false;

  @override
  void dispose() {
    _scannerCtrl.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode?.rawValue == null) return;

    setState(() => _isProcessing = true);
    final qrCode = barcode!.rawValue!;

    final sp = Provider.of<StationProvider>(context, listen: false);
    final station = await sp.getStationByQR(qrCode);

    if (!mounted) return;

    if (station != null) {
      Navigator.pushReplacementNamed(context, '/station', arguments: station);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('QR code tidak dikenali'),
          backgroundColor: Colors.redAccent,
        ),
      );
      setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          MobileScanner(controller: _scannerCtrl, onDetect: _onDetect),
          // Overlay
          Container(
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.5),
            ),
          ),
          // Scan frame
          Center(
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFF00E676), width: 3),
                borderRadius: BorderRadius.circular(20),
                color: Colors.transparent,
              ),
            ),
          ),
          // Clear center area
          Center(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(17),
              child: SizedBox(
                width: 274,
                height: 274,
                child: MobileScanner(
                  controller: _scannerCtrl,
                  onDetect: _onDetect,
                ),
              ),
            ),
          ),
          // Top bar
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.arrow_back_rounded,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Text(
                    'Scan QR Code',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => _showManualInputDialog(),
                    icon: const Icon(
                      Icons.keyboard_outlined,
                      color: Colors.white,
                    ),
                    tooltip: 'Input Manual',
                  ),
                ],
              ),
            ),
          ),
          // Bottom text
          Positioned(
            bottom: 80,
            left: 0,
            right: 0,
            child: Column(
              children: [
                if (_isProcessing)
                  const CircularProgressIndicator(color: Color(0xFF00E676))
                else
                  const Icon(
                    Icons.qr_code_rounded,
                    size: 40,
                    color: Colors.white54,
                  ),
                const SizedBox(height: 12),
                Text(
                  _isProcessing
                      ? 'Memproses...'
                      : 'Arahkan kamera ke QR code\ndi stasiun charging',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showManualInputDialog() async {
    final TextEditingController controller = TextEditingController();
    return showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1B263B),
          title: const Text(
            'Input Manual QR Code',
            style: TextStyle(color: Colors.white),
          ),
          content: TextField(
            controller: controller,
            autofocus: true,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              hintText: 'Masukkan kode stasiun (misal: STN-001)',
              hintStyle: TextStyle(color: Colors.white38),
              enabledBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: Colors.white24),
              ),
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: Color(0xFF00E676)),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Batal',
                style: TextStyle(color: Colors.white54),
              ),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00C853),
              ),
              onPressed: () {
                final code = controller.text.trim();
                Navigator.pop(context);
                if (code.isNotEmpty) {
                  _onDetect(
                    BarcodeCapture(barcodes: [Barcode(rawValue: code)]),
                  );
                }
              },
              child: const Text('Cari', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }
}

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/session_provider.dart';
import '../services/websocket_service.dart';

class ChargingScreen extends StatefulWidget {
  const ChargingScreen({super.key});

  @override
  State<ChargingScreen> createState() => _ChargingScreenState();
}

class _ChargingScreenState extends State<ChargingScreen>
    with SingleTickerProviderStateMixin {
  final WebSocketService _ws = WebSocketService();
  late AnimationController _pulseController;
  Timer? _pollTimer;
  final _currencyFormat = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _connectWebSocket();
    _startPolling();
  }

  void _connectWebSocket() async {
    final sp = Provider.of<SessionProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final session = sp.activeSession;
    final token = await auth.api.token;

    if (session != null && token != null) {
      _ws.onMessage = (data) {
        sp.updateFromWebSocket(data);
      };
      _ws.connect(session.id, token);
    }
  }

  void _startPolling() {
    // Fallback polling every 5 seconds in case WebSocket fails
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      final sp = Provider.of<SessionProvider>(context, listen: false);
      if (sp.activeSession != null) {
        sp.refreshSession(sp.activeSession!.id);
      }
    });
  }

  @override
  void dispose() {
    _ws.disconnect();
    _pulseController.dispose();
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _stopCharging() async {
    final sp = Provider.of<SessionProvider>(context, listen: false);
    if (sp.activeSession == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF1B2D45),
        title: const Text(
          'Stop Charging?',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'Apakah Anda yakin ingin menghentikan proses charging?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Stop',
              style: TextStyle(color: Colors.redAccent),
            ),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      await sp.stopSession(sp.activeSession!.id);
      await auth.refreshProfile();
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/home');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1B2A),
      body: Consumer<SessionProvider>(
        builder: (_, sp, __) {
          final session = sp.activeSession;
          if (session == null) {
            return const Center(
              child: Text(
                'Tidak ada sesi aktif',
                style: TextStyle(color: Colors.white),
              ),
            );
          }

          final progress = session.progress / 100.0;
          final isComplete = session.isCompleted;

          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Header
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Charging Session',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: isComplete
                              ? const Color(0xFF00C853).withValues(alpha: 0.15)
                              : Colors.amber.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          session.statusLabel,
                          style: TextStyle(
                            color: isComplete
                                ? const Color(0xFF00E676)
                                : Colors.amber,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),

                  // Progress circle
                  AnimatedBuilder(
                    animation: _pulseController,
                    builder: (_, __) {
                      final glow = isComplete
                          ? 0.4
                          : 0.2 + (_pulseController.value * 0.3);
                      return Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(
                                0xFF00C853,
                              ).withValues(alpha: glow),
                              blurRadius: 60,
                              spreadRadius: 15,
                            ),
                            BoxShadow(
                              color: const Color(
                                0xFF00E676,
                              ).withValues(alpha: glow * 0.5),
                              blurRadius: 30,
                              spreadRadius: 5,
                            ),
                          ],
                        ),
                        child: CircularPercentIndicator(
                          radius: 120,
                          lineWidth: 12,
                          percent: progress.clamp(0.0, 1.0),
                          center: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                    isComplete
                                        ? Icons.check_circle_rounded
                                        : Icons.bolt_rounded,
                                    color: const Color(0xFF00E676),
                                    size: 40,
                                  )
                                  .animate(target: isComplete ? 1 : 0)
                                  .shake(hz: 4, curve: Curves.easeInOut)
                                  .scale(
                                    begin: const Offset(1, 1),
                                    end: const Offset(1.2, 1.2),
                                  ),
                              const SizedBox(height: 8),
                              Text(
                                    '${session.progress}%',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 40,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  )
                                  .animate(target: isComplete ? 1 : 0)
                                  .shimmer(
                                    duration: 1200.ms,
                                    color: const Color(0xFF00E676),
                                  ),
                              Text(
                                isComplete ? 'Selesai!' : 'Charging...',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.6),
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          progressColor: const Color(0xFF00C853),
                          backgroundColor: Colors.white.withValues(alpha: 0.1),
                          circularStrokeCap: CircularStrokeCap.round,
                          animation: false,
                        ),
                      );
                    },
                  ),
                  const Spacer(),

                  // Stats
                  Row(
                    children: [
                      _statCard(
                        Icons.bolt_rounded,
                        '${session.energyKWH.toStringAsFixed(2)} kWh',
                        'Energi',
                      ),
                      const SizedBox(width: 12),
                      _statCard(
                        Icons.speed_rounded,
                        '${session.powerKW.toStringAsFixed(1)} kW',
                        'Daya',
                      ),
                      const SizedBox(width: 12),
                      _statCard(
                        Icons.payments_rounded,
                        _currencyFormat.format(session.totalCost),
                        'Biaya',
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Action buttons
                  if (isComplete)
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child:
                          ElevatedButton(
                                onPressed: () {
                                  sp.clearActive();
                                  Navigator.pushReplacementNamed(
                                    context,
                                    '/home',
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF00C853),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                child: const Text(
                                  'Kembali ke Beranda',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              )
                              .animate()
                              .scale(
                                duration: 400.ms,
                                curve: Curves.easeOutBack,
                              )
                              .fadeIn(),
                    )
                  else
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: OutlinedButton(
                        onPressed: _stopCharging,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.redAccent,
                          side: const BorderSide(color: Colors.redAccent),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.stop_circle_rounded),
                            SizedBox(width: 8),
                            Text(
                              'Stop Charging',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _statCard(IconData icon, String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF00E676), size: 24),
            const SizedBox(height: 8),
            FittedBox(
              child: Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

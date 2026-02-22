import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/station.dart';
import '../providers/auth_provider.dart';
import '../providers/session_provider.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  double _targetKWH = 2.0;
  final _currencyFormat = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  @override
  Widget build(BuildContext context) {
    final args =
        ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    final station = args['station'] as Station;
    final connector = args['connector'] as Connector;
    final estimatedCost = _targetKWH * connector.pricePerKWH;

    return Scaffold(
      backgroundColor: const Color(0xFF0D1B2A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'Pembayaran',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Summary card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: Column(
                children: [
                  _summaryRow('Stasiun', station.name),
                  const Divider(color: Colors.white12, height: 24),
                  _summaryRow('Connector', connector.connectorType),
                  const Divider(color: Colors.white12, height: 24),
                  _summaryRow('Daya', '${connector.powerKW} kW'),
                  const Divider(color: Colors.white12, height: 24),
                  _summaryRow(
                    'Tarif',
                    '${_currencyFormat.format(connector.pricePerKWH)}/kWh',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Target KWH selector
            const Text(
              'Target Energi (kWh)',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '${_targetKWH.toStringAsFixed(1)} kWh',
                        style: const TextStyle(
                          color: Color(0xFF00E676),
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (_targetKWH >=
                              (Provider.of<AuthProvider>(
                                        context,
                                        listen: false,
                                      ).user?.balance ??
                                      0) /
                                  connector.pricePerKWH &&
                          _targetKWH > 0.5)
                        Container(
                          margin: const EdgeInsets.only(left: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(
                              0xFF00E676,
                            ).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: const Color(
                                0xFF00E676,
                              ).withValues(alpha: 0.3),
                            ),
                          ),
                          child: const Text(
                            'MAX',
                            style: TextStyle(
                              color: Color(0xFF00E676),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Slider(
                    value: _targetKWH,
                    min: 0.5,
                    max: 20.0,
                    divisions: 39,
                    activeColor: const Color(0xFF00C853),
                    inactiveColor: Colors.white12,
                    onChanged: (v) => setState(() => _targetKWH = v),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '0.5 kWh',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.4),
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        '20.0 kWh',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.4),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(color: Colors.white10),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        final balance =
                            Provider.of<AuthProvider>(
                              context,
                              listen: false,
                            ).user?.balance ??
                            0;
                        final maxKwh = balance / connector.pricePerKWH;
                        setState(() {
                          // Cap at 20 (max slider) but let it go lower if balance is limited
                          _targetKWH = maxKwh > 20.0 ? 20.0 : maxKwh;
                          if (_targetKWH < 0.5) _targetKWH = 0.5;
                        });
                      },
                      icon: const Icon(Icons.flash_on_rounded, size: 18),
                      label: const Text('Isi Penuh (Sesuai Saldo)'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF00E676),
                        side: const BorderSide(color: Color(0xFF00C853)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Total cost
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF00C853).withValues(alpha: 0.15),
                    const Color(0xFF00C853).withValues(alpha: 0.05),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF00C853).withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Total Biaya',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    _currencyFormat.format(estimatedCost),
                    style: const TextStyle(
                      color: Color(0xFF00E676),
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Low Balance Alert
            if (estimatedCost >
                (Provider.of<AuthProvider>(context).user?.balance ?? 0))
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Colors.redAccent.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.warning_amber_rounded,
                      color: Colors.redAccent,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'Saldo tidak cukup untuk target ini.',
                        style: TextStyle(
                          color: Colors.redAccent,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pushNamed(context, '/topup'),
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: const Size(0, 0),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Top Up',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 30),

            // Pay button
            Consumer<SessionProvider>(
              builder: (_, sp, __) => SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: sp.isLoading
                      ? null
                      : () => _processPayment(connector.id),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00C853),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 5,
                  ),
                  child: sp.isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.payment_rounded),
                            SizedBox(width: 10),
                            Text(
                              'Bayar & Mulai Charging',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Text(
                'Pembayaran dummy untuk development',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _processPayment(String connectorId) async {
    final sp = Provider.of<SessionProvider>(context, listen: false);

    // 1. Create session
    final result = await sp.createSession(connectorId, _targetKWH);
    if (result == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(sp.error ?? 'Gagal membuat sesi'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
      return;
    }

    // 2. Pay (dummy)
    final paymentId = result['session']?['payment']?['id'];
    if (paymentId == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment ID tidak ditemukan'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
      return;
    }

    final paid = await sp.paySession(paymentId);
    if (paid && mounted) {
      Navigator.pushReplacementNamed(context, '/charging');
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(sp.error ?? 'Pembayaran gagal'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  Widget _summaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.5),
            fontSize: 14,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

import 'station.dart';

class ChargingSession {
  final String id;
  final String userId;
  final String connectorId;
  final String status;
  final double energyKWH;
  final double powerKW;
  final int progress;
  final double totalCost;
  final double targetKWH;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final DateTime createdAt;
  final Connector? connector;

  ChargingSession({
    required this.id,
    required this.userId,
    required this.connectorId,
    required this.status,
    required this.energyKWH,
    required this.powerKW,
    required this.progress,
    required this.totalCost,
    required this.targetKWH,
    this.startedAt,
    this.endedAt,
    required this.createdAt,
    this.connector,
  });

  factory ChargingSession.fromJson(Map<String, dynamic> json) {
    return ChargingSession(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      connectorId: json['connector_id'] ?? '',
      status: json['status'] ?? '',
      energyKWH: (json['energy_kwh'] ?? 0).toDouble(),
      powerKW: (json['power_kw'] ?? 0).toDouble(),
      progress: json['progress'] ?? 0,
      totalCost: (json['total_cost'] ?? 0).toDouble(),
      targetKWH: (json['target_kwh'] ?? 0).toDouble(),
      startedAt: json['started_at'] != null
          ? DateTime.tryParse(json['started_at'])
          : null,
      endedAt: json['ended_at'] != null
          ? DateTime.tryParse(json['ended_at'])
          : null,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      connector: json['connector'] != null
          ? Connector.fromJson(json['connector'])
          : null,
    );
  }

  bool get isActive =>
      status == 'pending' || status == 'paid' || status == 'charging';

  bool get isCharging => status == 'charging';

  bool get isCompleted => status == 'completed';

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Menunggu Pembayaran';
      case 'paid':
        return 'Dibayar';
      case 'charging':
        return 'Sedang Charging';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      case 'failed':
        return 'Gagal';
      default:
        return status;
    }
  }
}

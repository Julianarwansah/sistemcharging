import 'package:flutter/material.dart';
import '../models/session.dart';
import '../services/api_service.dart';

class SessionProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  ChargingSession? _activeSession;
  List<ChargingSession> _history = [];
  bool _isLoading = false;
  String? _error;

  ChargingSession? get activeSession => _activeSession;
  List<ChargingSession> get history => _history;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<Map<String, dynamic>?> createSession(
    String connectorId,
    double targetKWH,
  ) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _api.createSession(connectorId, targetKWH);
      if (data['statusCode'] == 201) {
        _activeSession = ChargingSession.fromJson(data['session']);
        _isLoading = false;
        notifyListeners();
        return data;
      } else {
        _error = data['error'] ?? 'Gagal membuat sesi';
      }
    } catch (e) {
      _error = 'Koneksi gagal';
    }

    _isLoading = false;
    notifyListeners();
    return null;
  }

  Future<bool> paySession(String paymentId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final data = await _api.dummyPay(paymentId);
      if (data['statusCode'] == 200) {
        _activeSession = ChargingSession.fromJson(data['session']);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['error'];
      }
    } catch (e) {
      _error = 'Pembayaran gagal';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> refreshSession(String sessionId) async {
    try {
      final data = await _api.getSession(sessionId);
      _activeSession = ChargingSession.fromJson(data);
      notifyListeners();
    } catch (_) {}
  }

  void updateFromWebSocket(Map<String, dynamic> data) {
    if (_activeSession != null) {
      _activeSession = ChargingSession(
        id: _activeSession!.id,
        userId: _activeSession!.userId,
        connectorId: _activeSession!.connectorId,
        status: data['status'] ?? _activeSession!.status,
        energyKWH: (data['energy_kwh'] ?? _activeSession!.energyKWH).toDouble(),
        powerKW: (data['power_kw'] ?? _activeSession!.powerKW).toDouble(),
        progress: data['progress'] ?? _activeSession!.progress,
        totalCost: (data['total_cost'] ?? _activeSession!.totalCost).toDouble(),
        targetKWH: _activeSession!.targetKWH,
        startedAt: _activeSession!.startedAt,
        endedAt: _activeSession!.endedAt,
        createdAt: _activeSession!.createdAt,
        connector: _activeSession!.connector,
      );
      notifyListeners();
    }
  }

  Future<bool> stopSession(String sessionId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final data = await _api.stopSession(sessionId);
      if (data['statusCode'] == 200) {
        _activeSession = null;
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (_) {}

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> loadHistory() async {
    _isLoading = true;
    notifyListeners();

    try {
      final data = await _api.getHistory();
      final list = data['sessions'] as List<dynamic>? ?? [];
      _history = list.map((s) => ChargingSession.fromJson(s)).toList();
    } catch (_) {
      _history = [];
    }

    _isLoading = false;
    notifyListeners();
  }

  void clearActive() {
    _activeSession = null;
    notifyListeners();
  }
}

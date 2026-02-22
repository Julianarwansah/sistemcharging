import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../models/station.dart';
import '../services/api_service.dart';

class StationProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  List<Station> _stations = [];
  Station? _selectedStation;
  bool _isLoading = false;
  Timer? _pollingTimer;
  Position? _userPosition;

  List<Station> get stations => _stations;
  Station? get selectedStation => _selectedStation;
  bool get isLoading => _isLoading;
  Position? get userPosition => _userPosition;

  void startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      loadStations(silent: true);
    });
  }

  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  Future<void> loadStations({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      // Try to get current position for sorting
      try {
        _userPosition = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.low,
          ),
        ).timeout(const Duration(seconds: 3));
      } catch (_) {
        // Fallback or ignore location error
      }

      final data = await _api.getStations();
      final list = data['stations'] as List<dynamic>? ?? [];
      _stations = list.map((s) => Station.fromJson(s)).toList();

      // Calculate distances and sort
      if (_userPosition != null) {
        for (var station in _stations) {
          station.distance = Geolocator.distanceBetween(
            _userPosition!.latitude,
            _userPosition!.longitude,
            station.latitude,
            station.longitude,
          );
        }
        _stations.sort((a, b) => (a.distance ?? 0).compareTo(b.distance ?? 0));
      }
    } catch (e) {
      _stations = [];
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<Station?> getStationByQR(String qrCode) async {
    try {
      final data = await _api.getStationByQR(qrCode);
      if (data['statusCode'] == 200) {
        _selectedStation = Station.fromJson(data);
        notifyListeners();
        return _selectedStation;
      }
    } catch (_) {}
    return null;
  }

  Future<Station?> getStation(String id) async {
    try {
      final data = await _api.getStation(id);
      _selectedStation = Station.fromJson(data);
      notifyListeners();
      return _selectedStation;
    } catch (_) {}
    return null;
  }

  void clearSelection() {
    _selectedStation = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}

import 'package:flutter/material.dart';
import '../models/station.dart';
import '../services/api_service.dart';

class StationProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  List<Station> _stations = [];
  Station? _selectedStation;
  bool _isLoading = false;

  List<Station> get stations => _stations;
  Station? get selectedStation => _selectedStation;
  bool get isLoading => _isLoading;

  Future<void> loadStations() async {
    _isLoading = true;
    notifyListeners();

    try {
      final data = await _api.getStations();
      final list = data['stations'] as List<dynamic>? ?? [];
      _stations = list.map((s) => Station.fromJson(s)).toList();
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
}

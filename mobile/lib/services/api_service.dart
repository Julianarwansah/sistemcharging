import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class ApiService {
  String? _token;

  Future<String?> get token async {
    if (_token != null) return _token;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    return _token;
  }

  Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  Future<Map<String, String>> _headers() async {
    final t = await token;
    return {
      'Content-Type': 'application/json',
      if (t != null) 'Authorization': 'Bearer $t',
    };
  }

  // ─── Auth ───
  Future<Map<String, dynamic>> register(
    String name,
    String email,
    String phone,
    String password,
  ) async {
    final res = await http.post(
      Uri.parse('${AppConfig.apiUrl}/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'email': email,
        'phone': phone,
        'password': password,
      }),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) {
      await setToken(data['token']);
    }
    return {'statusCode': res.statusCode, ...data};
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('${AppConfig.apiUrl}/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      await setToken(data['token']);
    }
    return {'statusCode': res.statusCode, ...data};
  }

  Future<Map<String, dynamic>> getProfile() async {
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/auth/profile'),
      headers: await _headers(),
    );
    return jsonDecode(res.body);
  }

  // ─── Stations ───
  Future<Map<String, dynamic>> getStations() async {
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/stations'),
      headers: await _headers(),
    );
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> getStation(String id) async {
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/stations/$id'),
      headers: await _headers(),
    );
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> getStationByQR(String code) async {
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/stations/qr/$code'),
      headers: await _headers(),
    );
    return {'statusCode': res.statusCode, ...jsonDecode(res.body)};
  }

  // ─── Sessions ───
  Future<Map<String, dynamic>> createSession(
    String connectorId,
    double targetKWH,
  ) async {
    final res = await http.post(
      Uri.parse('${AppConfig.apiUrl}/sessions'),
      headers: await _headers(),
      body: jsonEncode({'connector_id': connectorId, 'target_kwh': targetKWH}),
    );
    return {'statusCode': res.statusCode, ...jsonDecode(res.body)};
  }

  Future<Map<String, dynamic>> getSession(String id) async {
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/sessions/$id'),
      headers: await _headers(),
    );
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> stopSession(String id) async {
    final res = await http.post(
      Uri.parse('${AppConfig.apiUrl}/sessions/$id/stop'),
      headers: await _headers(),
    );
    return {'statusCode': res.statusCode, ...jsonDecode(res.body)};
  }

  Future<Map<String, dynamic>> getHistory() async {
    final res = await http.get(
      Uri.parse('${AppConfig.apiUrl}/sessions/history'),
      headers: await _headers(),
    );
    return jsonDecode(res.body);
  }

  // ─── Payment ───
  Future<Map<String, dynamic>> dummyPay(String paymentId) async {
    final res = await http.post(
      Uri.parse('${AppConfig.apiUrl}/payments/pay/$paymentId'),
      headers: await _headers(),
    );
    return {'statusCode': res.statusCode, ...jsonDecode(res.body)};
  }
}

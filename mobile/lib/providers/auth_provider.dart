import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  User? _user;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  String? get error => _error;
  ApiService get api => _api;

  Future<bool> checkAuth() async {
    final token = await _api.token;
    if (token == null) return false;

    try {
      final data = await _api.getProfile();
      if (data['id'] != null) {
        _user = User.fromJson(data);
        notifyListeners();
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _api.login(email, password);
      if (data['statusCode'] == 200) {
        _user = User.fromJson(data['user']);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['error'] ?? 'Login gagal';
      }
    } catch (e) {
      _error = 'Tidak dapat terhubung ke server';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> register(
    String name,
    String email,
    String phone,
    String password,
  ) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _api.register(name, email, phone, password);
      if (data['statusCode'] == 201) {
        _user = User.fromJson(data['user']);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['error'] ?? 'Registrasi gagal';
      }
    } catch (e) {
      _error = 'Tidak dapat terhubung ke server';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> loginWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final GoogleSignIn googleSignIn = GoogleSignIn(
        serverClientId:
            '528933132584-c15hlcdttk6a2lc4vs8iueq84hjkj7aq.apps.googleusercontent.com',
      );
      final GoogleSignInAccount? googleUser = await googleSignIn.signIn();

      if (googleUser == null) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        _error = 'Gagal mendapatkan token Google';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final data = await _api.googleLogin(idToken);
      if (data['statusCode'] == 200) {
        _user = User.fromJson(data['user']);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['error'] ?? 'Login Google gagal';
      }
    } catch (e) {
      _error = 'Kesalahan saat login Google: $e';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    try {
      await _api.logout();
    } catch (_) {}
    await _api.clearToken();
    _user = null;
    notifyListeners();
  }
}

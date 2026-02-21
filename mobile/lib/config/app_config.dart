class AppConfig {
  // Change this to your backend server IP/URL
  // For Android emulator use 10.0.2.2 instead of localhost
  // For physical device use your computer's local IP
  static const String baseUrl = 'http://192.168.1.10:8080';
  static const String apiUrl = '$baseUrl/api/v1';
  static const String wsUrl = 'ws://192.168.1.10:8080/api/v1/ws';
}

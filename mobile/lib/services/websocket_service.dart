import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../config/app_config.dart';

class WebSocketService {
  WebSocketChannel? _channel;
  Function(Map<String, dynamic>)? onMessage;

  void connect(String sessionId, String token) {
    final url = '${AppConfig.wsUrl}/session/$sessionId?token=$token';
    _channel = WebSocketChannel.connect(Uri.parse(url));

    _channel!.stream.listen(
      (data) {
        try {
          final parsed = jsonDecode(data);
          if (onMessage != null) {
            onMessage!(parsed);
          }
        } catch (e) {
          // ignore malformed messages
        }
      },
      onError: (error) {
        // Reconnect after error
        Future.delayed(const Duration(seconds: 3), () {
          connect(sessionId, token);
        });
      },
      onDone: () {
        // Connection closed
      },
    );
  }

  void disconnect() {
    _channel?.sink.close();
    _channel = null;
  }
}

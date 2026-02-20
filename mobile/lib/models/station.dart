class Station {
  final String id;
  final String name;
  final String address;
  final double latitude;
  final double longitude;
  final String qrCode;
  final String status;
  final List<Connector> connectors;

  Station({
    required this.id,
    required this.name,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.qrCode,
    required this.status,
    required this.connectors,
  });

  factory Station.fromJson(Map<String, dynamic> json) {
    return Station(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      latitude: (json['latitude'] ?? 0).toDouble(),
      longitude: (json['longitude'] ?? 0).toDouble(),
      qrCode: json['qr_code'] ?? '',
      status: json['status'] ?? '',
      connectors: (json['connectors'] as List<dynamic>?)
              ?.map((c) => Connector.fromJson(c))
              .toList() ??
          [],
    );
  }
}

class Connector {
  final String id;
  final String stationId;
  final String connectorType;
  final double powerKW;
  final double pricePerKWH;
  final String status;
  final String mqttTopic;

  Connector({
    required this.id,
    required this.stationId,
    required this.connectorType,
    required this.powerKW,
    required this.pricePerKWH,
    required this.status,
    required this.mqttTopic,
  });

  factory Connector.fromJson(Map<String, dynamic> json) {
    return Connector(
      id: json['id'] ?? '',
      stationId: json['station_id'] ?? '',
      connectorType: json['connector_type'] ?? '',
      powerKW: (json['power_kw'] ?? 0).toDouble(),
      pricePerKWH: (json['price_per_kwh'] ?? 0).toDouble(),
      status: json['status'] ?? '',
      mqttTopic: json['mqtt_topic'] ?? '',
    );
  }

  bool get isAvailable => status == 'available';
}

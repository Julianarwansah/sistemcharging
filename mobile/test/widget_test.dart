import 'package:flutter_test/flutter_test.dart';
import 'package:sistemcharging/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const SistemChargingApp());
    // Verify splash screen loads
    expect(find.text('SistemCharging'), findsOneWidget);
  });
}

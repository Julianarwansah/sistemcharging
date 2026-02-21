import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/station_provider.dart';
import 'providers/session_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/home_screen.dart';
import 'screens/scan_screen.dart';
import 'screens/station_detail_screen.dart';
import 'screens/payment_screen.dart';
import 'screens/charging_screen.dart';
import 'screens/history_screen.dart';
import 'screens/map_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/topup_screen.dart';

void main() {
  runApp(const SistemChargingApp());
}

class SistemChargingApp extends StatelessWidget {
  const SistemChargingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => StationProvider()),
        ChangeNotifierProvider(create: (_) => SessionProvider()),
      ],
      child: MaterialApp(
        title: 'SistemCharging',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          brightness: Brightness.dark,
          primaryColor: const Color(0xFF00C853),
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFF00C853),
            secondary: Color(0xFF00E676),
            surface: Color(0xFF0D1B2A),
          ),
          scaffoldBackgroundColor: const Color(0xFF0D1B2A),
          textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
          useMaterial3: true,
        ),
        initialRoute: '/',
        routes: {
          '/': (_) => const SplashScreen(),
          '/login': (_) => const LoginScreen(),
          '/register': (_) => const RegisterScreen(),
          '/home': (_) => const HomeScreen(),
          '/scan': (_) => const ScanScreen(),
          '/station': (_) => const StationDetailScreen(),
          '/payment': (_) => const PaymentScreen(),
          '/charging': (_) => const ChargingScreen(),
          '/history': (_) => const HistoryScreen(),
          '/map': (_) => const StationMapScreen(),
          '/profile': (_) => const ProfileScreen(),
          '/topup': (_) => const TopUpScreen(),
        },
      ),
    );
  }
}

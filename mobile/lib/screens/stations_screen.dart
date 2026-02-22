import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/station_provider.dart';
import '../models/station.dart';

class StationsScreen extends StatefulWidget {
  const StationsScreen({super.key});

  @override
  State<StationsScreen> createState() => _StationsScreenState();
}

class _StationsScreenState extends State<StationsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (!mounted) return;
      Provider.of<StationProvider>(context, listen: false).loadStations();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1B2A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'Stasiun Charging',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(20),
            child: TextField(
              controller: _searchController,
              onChanged: (value) {
                setState(() {
                  _searchQuery = value.toLowerCase();
                });
              },
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Cari stasiun atau alamat...',
                hintStyle: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                ),
                prefixIcon: const Icon(Icons.search, color: Color(0xFF00E676)),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.05),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),

          // List
          Expanded(
            child: Consumer<StationProvider>(
              builder: (_, sp, __) {
                final filteredStations = sp.stations.where((s) {
                  return s.name.toLowerCase().contains(_searchQuery) ||
                      s.address.toLowerCase().contains(_searchQuery);
                }).toList();

                if (sp.isLoading && sp.stations.isEmpty) {
                  return const Center(
                    child: CircularProgressIndicator(color: Color(0xFF00E676)),
                  );
                }

                if (filteredStations.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.search_off_rounded,
                          size: 60,
                          color: Colors.white.withValues(alpha: 0.2),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Stasiun tidak ditemukan',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.4),
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => sp.loadStations(),
                  color: const Color(0xFF00E676),
                  backgroundColor: const Color(0xFF1B263B),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: filteredStations.length,
                    itemBuilder: (_, i) {
                      final station = filteredStations[i];
                      return _buildStationCard(station);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStationCard(Station station) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Hero(
          tag: 'station-icon-${station.id}',
          child: Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: const Color(0xFF00C853).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                const Icon(Icons.ev_station_rounded, color: Color(0xFF00E676)),
              ],
            ),
          ),
        ),
        title: Text(
          station.name,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                station.address,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5),
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  _statusBadge(station.status),
                  const SizedBox(width: 8),
                  Text(
                    '${station.connectors.length} connector',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        trailing: const Icon(
          Icons.chevron_right_rounded,
          color: Colors.white38,
        ),
        onTap: () {
          Navigator.pushNamed(context, '/station', arguments: station);
        },
      ),
    );
  }

  Widget _statusBadge(String status) {
    final isActive = status == 'active';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: (isActive ? const Color(0xFF00C853) : Colors.orange).withValues(
          alpha: 0.15,
        ),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        isActive ? 'Aktif' : 'Maintenance',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: isActive ? const Color(0xFF00E676) : Colors.orange,
        ),
      ),
    );
  }
}

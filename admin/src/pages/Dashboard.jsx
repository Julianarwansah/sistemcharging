import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    Users,
    BatteryCharging,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    Loader2,
    Clock,
    ShieldCheck,
    Activity
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { adminService } from '../services/api';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const initialChartData = [
    { name: '', total: 0 },
];

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [stations, setStations] = useState([]);
    const [activeStations, setActiveStations] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, stationsRes, revenueRes, activeRes, notifRes, activityRes] = await Promise.all([
                    adminService.getStats(),
                    adminService.getStations(),
                    adminService.getRevenueStats(),
                    adminService.getActiveStations(),
                    adminService.getNotifications(),
                    adminService.getActivityLogs()
                ]);
                setStats(statsRes.data);
                setStations(stationsRes.data.stations || []);
                setRevenueData(revenueRes.data.map(item => ({
                    name: item.date,
                    total: item.total
                })));
                setActiveStations(activeRes.data || []);
                setNotifications(notifRes.data || []);
                setActivityLogs(activityRes.data || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();

        // WebSocket for real-time updates
        const token = localStorage.getItem('admin_token');
        const ws = new WebSocket(`ws://${window.location.hostname}:8080/api/v1/ws/admin${token ? `?token=${token}` : ''}`);

        ws.onopen = () => {
            // Need to authenticate if using protected route
            // For now assuming the backend might need a token if it's in protected group
            // Though HandleTopic is in protected group in main.go
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'balance_update' || data.type === 'session_update' || data.status) {
                // Refresh stats on any significant update
                fetchDashboardData();
            }
        };

        return () => ws.close();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 max-w-full overflow-x-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold break-words">Halo, Admin 👋</h1>
                    <p className="text-foreground/50 mt-1 text-sm sm:text-base break-words">Berikut ringkasan performa sistem charging hari ini.</p>
                </div>
                <button
                    onClick={async () => {
                        if (window.confirm('Apakah Anda yakin ingin MERESET seluruh data transaksi dan saldo? Tindakan ini tidak dapat dibatalkan.')) {
                            try {
                                await adminService.resetData();
                                alert('Data berhasil direset!');
                                window.location.reload();
                            } catch (error) {
                                alert('Gagal mereset data: ' + error.message);
                            }
                        }
                    }}
                    className="px-6 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/20 rounded-xl transition-all font-medium text-sm flex items-center gap-2 w-fit"
                >
                    <Zap className="w-4 h-4" />
                    Reset Semua Data
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Pendapatan"
                    value={`Rp ${new Intl.NumberFormat('id-ID').format(stats?.total_revenue || 0)}`}
                    icon={DollarSign}
                    trend="+12.5%"
                    trendUp={true}
                    color="bg-primary"
                />
                <StatCard
                    title="Total Pengguna"
                    value={stats?.total_users || 0}
                    icon={Users}
                    trend="+5.2%"
                    trendUp={true}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Stasiun Aktif"
                    value={`${stats?.active_stations || 0} / ${stations.length}`}
                    icon={BatteryCharging}
                    trend="-2"
                    trendUp={false}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Total Energi"
                    value={`${stats?.total_energy?.toFixed(1) || 0} kWh`}
                    icon={Zap}
                    trend="+8.1%"
                    trendUp={true}
                    color="bg-purple-500"
                />
            </div>

            {/* Chart & Popular Stations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass rounded-3xl p-4 lg:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <h3 className="text-xl font-bold">Tren Transaksi</h3>
                        <select className="bg-foreground/5 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none w-full sm:w-auto">
                            <option>7 Hari Terakhir</option>
                            <option>30 Hari Terakhir</option>
                        </select>
                    </div>
                    <div className="h-[250px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData.length > 0 ? revenueData : initialChartData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00C853" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                                    tickFormatter={(value) => `Rp${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--card-color)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        color: 'var(--text-color)',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ color: 'var(--primary-color)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#00C853"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Map Section */}
            <div className="lg:col-span-3 glass rounded-3xl p-4 overflow-hidden h-[400px] relative">
                <div className="absolute top-8 left-8 z-[10] flex flex-col gap-1 pointer-events-none">
                    <h3 className="text-xl font-bold text-white drop-shadow-md">Sebaran Stasiun</h3>
                    <p className="text-xs text-white/70 drop-shadow-md">Lokasi pengisian daya di seluruh wilayah</p>
                </div>
                <MapContainer
                    center={[-6.2088, 106.8456]}
                    zoom={11}
                    style={{ height: '100%', width: '100%', borderRadius: '1.5rem' }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {stations.map(station => (
                        <Marker
                            key={station.id}
                            position={[station.latitude, station.longitude]}
                        >
                            <Popup>
                                <div className="p-1">
                                    <p className="font-bold text-sm text-primary">{station.name}</p>
                                    <p className="text-[10px] text-foreground/60 mt-0.5">{station.address}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${station.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-500'}`}>
                                            {station.status}
                                        </span>
                                        <span className="text-[9px] text-foreground/40 font-mono">{station.connectors?.length || 0} Konektor</span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Popular Stations Section */}
            <div className="glass rounded-3xl p-6 lg:p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Performa Stasiun
                </h3>
                <div className="space-y-6">
                    {activeStations.length > 0 ? (
                        activeStations.slice(0, 5).map((station) => (
                            <StationRankItem
                                key={station.id}
                                name={station.name}
                                uses={station.transaction_count}
                                income={`Rp ${new Intl.NumberFormat('id-ID').format(station.total_revenue)}`}
                            />
                        ))
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-foreground/30 text-xs italic">Belum ada data transaksi.</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => navigate('/stations')}
                    className="w-full mt-8 py-3 rounded-xl border border-border text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-all text-sm font-medium"
                >
                    Lihat Semua Stasiun
                </button>
            </div>

            {/* Live Monitoring Section (Real-time IoT simulation view) */}
            <div className="mt-8">
                <LiveChargingMonitor activeStations={activeStations} />
            </div>

            {/* Bottom Row: Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Recent Activity */}
                <div className="glass rounded-3xl p-6 lg:p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Sistem & Transaksi
                    </h3>
                    <div className="space-y-4">
                        {notifications.length > 0 ? (
                            notifications.slice(0, 5).map((notif, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-foreground/5 border border-border hover:border-primary/20 transition-all">
                                    <div className={`p-2 rounded-lg ${notif.type === 'payment' ? 'bg-primary/10 text-primary' :
                                        notif.type === 'user' ? 'bg-blue-500/10 text-blue-500' :
                                            'bg-orange-500/10 text-orange-500'
                                        }`}>
                                        {notif.type === 'payment' ? <DollarSign className="w-4 h-4" /> :
                                            notif.type === 'user' ? <Users className="w-4 h-4" /> :
                                                <Zap className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm truncate">{notif.title}</p>
                                        <p className="text-xs text-foreground/40 mt-1 line-clamp-2">{notif.message}</p>
                                        <p className="text-[10px] text-foreground/20 mt-2">
                                            {typeof notif.time === 'string' ? notif.time : new Date(notif.time).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-foreground/20 italic text-sm">Belum ada aktivitas terbaru.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Admin Activity Logs */}
                <div className="glass rounded-3xl p-6 lg:p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        Log Administrator
                    </h3>
                    <div className="space-y-4">
                        {activityLogs.length > 0 ? (
                            activityLogs.slice(0, 5).map((log, idx) => (
                                <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl bg-foreground/5 border border-border hover:border-primary/20 transition-all">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-bold text-sm truncate">{log.admin_name}</p>
                                            <span className="text-[9px] uppercase font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                {log.action}
                                            </span>
                                        </div>
                                        <p className="text-xs text-foreground/40 mt-1 line-clamp-2">{log.detail}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-[10px] text-foreground/20">
                                                {new Date(log.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                            </p>
                                            <p className="text-[9px] text-foreground/10 font-mono">{log.ip_address}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-foreground/20 italic text-sm">Belum ada log aktivitas admin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function LiveChargingMonitor({ activeStations }) {
    return (
        <div className="glass rounded-3xl p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Monitoring Sesi Aktif
                    </h3>
                    <p className="text-xs text-foreground/40 mt-1">Status pengisian daya secara real-time</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Live</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeStations && activeStations.length > 0 ? (
                    activeStations.map((station) => (
                        <div key={station.id} className="p-5 rounded-2xl bg-foreground/5 border border-border hover:border-primary/20 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="font-bold text-sm truncate">{station.name}</h4>
                                    <p className="text-[10px] text-foreground/40 mt-0.5">{station.address}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Zap className="w-3.5 h-3.5" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-end justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-foreground/30 uppercase font-black tracking-widest">Konsumsi</p>
                                        <p className="text-lg font-bold text-primary">2.4 <span className="text-xs font-normal">kWh</span></p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[10px] text-foreground/30 uppercase font-black tracking-widest">Waktu</p>
                                        <p className="text-sm font-mono font-bold">12:45</p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-foreground/40">Status Pengisian</span>
                                        <span className="text-primary animate-pulse">85%</span>
                                    </div>
                                    <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-foreground/[0.02] rounded-3xl border border-dashed border-border">
                        <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                            <Activity className="w-6 h-6 text-foreground/20" />
                        </div>
                        <p className="text-foreground/30 text-xs italic">Tidak ada sesi pengisian daya aktif saat ini.</p>
                        <p className="text-[9px] text-foreground/20 mt-1 uppercase tracking-widest font-bold">Menunggu simulasi IoT...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color }) {
    return (
        <div className="glass rounded-3xl p-6 transition-transform hover:scale-[1.02] cursor-default">
            <div className="flex items-start justify-between">
                <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-white`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-primary' : 'text-orange-500'}`}>
                    {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {trend}
                </div>
            </div>
            <div className="mt-4">
                <p className="text-foreground/40 text-sm font-medium">{title}</p>
                <h4 className="text-2xl font-bold mt-1 tracking-tight">{value}</h4>
            </div>
        </div>
    );
}

function StationRankItem({ name, uses, income, customLabel }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="min-w-0 pr-4">
                <h5 className="font-bold text-sm group-hover:text-primary transition-colors truncate">{name}</h5>
                <p className="text-xs text-foreground/40 mt-0.5">
                    {customLabel === 'status' ? `${uses} connector` : `${uses} transaksi hari ini`}
                </p>
            </div>
            <div className="text-right shrink-0">
                <p className={`font-bold text-sm ${income === 'active' || income.startsWith('Rp') ? 'text-primary' : 'text-orange-500'}`}>
                    {income}
                </p>
            </div>
        </div>
    );
}

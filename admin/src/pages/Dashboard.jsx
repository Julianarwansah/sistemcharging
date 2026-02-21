import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    BatteryCharging,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    Loader2
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
import { adminService } from '../services/api';

const data = [
    { name: '01 Feb', total: 4000 },
    { name: '05 Feb', total: 3000 },
    { name: '10 Feb', total: 5000 },
    { name: '15 Feb', total: 4500 },
    { name: '20 Feb', total: 6000 },
    { name: '21 Feb', total: 8000 },
];

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, stationsRes] = await Promise.all([
                    adminService.getStats(),
                    adminService.getStations()
                ]);
                setStats(statsRes.data);
                setStations(stationsRes.data.stations || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();

        // WebSocket for real-time updates
        const token = localStorage.getItem('token');
        const ws = new WebSocket(`ws://${window.location.hostname}:8080/api/v1/ws/admin`);

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
                    <p className="text-white/50 mt-1 text-sm sm:text-base break-words">Berikut ringkasan performa sistem charging hari ini.</p>
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
                        <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none w-full sm:w-auto">
                            <option>7 Hari Terakhir</option>
                            <option>30 Hari Terakhir</option>
                        </select>
                    </div>
                    <div className="h-[250px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00C853" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#ffffff60', fontSize: 10 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#ffffff60', fontSize: 10 }}
                                    tickFormatter={(value) => `Rp${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1B263B',
                                        border: '1px solid #ffffff10',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ color: '#00C853' }}
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

                {/* Popular Stations Section */}
                <div className="glass rounded-3xl p-6 lg:p-8">
                    <h3 className="text-xl font-bold mb-6">Stasiun Charging</h3>
                    <div className="space-y-6">
                        {stations.slice(0, 4).map((station) => (
                            <PopularStation
                                key={station.id}
                                name={station.name}
                                uses={station.connectors?.length || 0}
                                income={station.status}
                                customLabel="status"
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => window.location.hash = '/stations'}
                        className="w-full mt-8 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                    >
                        Lihat Semua Stasiun
                    </button>
                </div>
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
                <p className="text-white/40 text-sm font-medium">{title}</p>
                <h4 className="text-2xl font-bold mt-1 tracking-tight">{value}</h4>
            </div>
        </div>
    );
}

function PopularStation({ name, uses, income, customLabel }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="min-w-0 pr-4">
                <h5 className="font-bold text-sm group-hover:text-primary transition-colors truncate">{name}</h5>
                <p className="text-xs text-white/40 mt-0.5">
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

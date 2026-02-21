import React from 'react';
import {
    TrendingUp,
    Users,
    BatteryCharging,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Zap
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

const data = [
    { name: '01 Feb', total: 4000 },
    { name: '05 Feb', total: 3000 },
    { name: '10 Feb', total: 5000 },
    { name: '15 Feb', total: 4500 },
    { name: '20 Feb', total: 6000 },
    { name: '21 Feb', total: 8000 },
];

export default function Dashboard() {
    return (
        <div className="space-y-6 sm:space-y-8 max-w-full overflow-x-hidden">
            {/* Welcome Section */}
            <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold break-words">Halo, Admin 👋</h1>
                <p className="text-white/50 mt-1 text-sm sm:text-base break-words">Berikut ringkasan performa sistem charging hari ini.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Pendapatan"
                    value="Rp 12.450.000"
                    icon={DollarSign}
                    trend="+12.5%"
                    trendUp={true}
                    color="bg-primary"
                />
                <StatCard
                    title="Total Pengguna"
                    value="1.284"
                    icon={Users}
                    trend="+5.2%"
                    trendUp={true}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Stasiun Aktif"
                    value="42 / 45"
                    icon={BatteryCharging}
                    trend="-2"
                    trendUp={false}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Total Energi"
                    value="1.420 kWh"
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
                    <h3 className="text-xl font-bold mb-6">Stasiun Populer</h3>
                    <div className="space-y-6">
                        <PopularStation name="Pakuwon Mall Station" uses="142" income="Rp 2.100.000" />
                        <PopularStation name="Tunjungan Plaza C1" uses="98" income="Rp 1.450.000" />
                        <PopularStation name="Galaxy Mall 3 P2" uses="76" income="Rp 1.100.000" />
                        <PopularStation name="Grand City Station" uses="54" income="Rp 850.000" />
                    </div>
                    <button className="w-full mt-8 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
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

function PopularStation({ name, uses, income }) {
    return (
        <div className="flex items-center justify-between group">
            <div>
                <h5 className="font-bold text-sm group-hover:text-primary transition-colors">{name}</h5>
                <p className="text-xs text-white/40 mt-0.5">{uses} transaksi hari ini</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-sm text-primary">{income}</p>
            </div>
        </div>
    );
}

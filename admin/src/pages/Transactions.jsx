import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Download,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { adminService } from '../services/api';

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await adminService.getTransactions();
            setTransactions(res.data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        const filtered = transactions.filter(trx => {
            const matchesSearch =
                trx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                trx.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                trx.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' ||
                trx.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        const headers = ['ID', 'User', 'Email', 'Station', 'Connector', 'Energy (kWh)', 'Amount (IDR)', 'Date', 'Status'];
        const rows = filtered.map(t => [
            t.id,
            t.user?.name || 'Unknown',
            t.user?.email || '',
            t.connector?.station?.name || 'Manual',
            t.connector?.connector_type || '',
            t.energy_kwh,
            t.total_cost,
            new Date(t.created_at).toLocaleString(),
            t.status
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transaksi-charging-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 max-w-full overflow-x-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold break-words">Riwayat Transaksi</h1>
                    <p className="text-white/50 mt-1 text-sm sm:text-base break-words">Daftar semua sesi charging dan pembayaran pengguna.</p>
                </div>
                <button
                    onClick={downloadCSV}
                    className="bg-white/5 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-all w-full sm:w-auto"
                >
                    <Download className="w-5 h-5" />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari ID Transaksi atau User..."
                        className="w-full bg-card border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                    <select className="w-full bg-card border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none appearance-none">
                        <option>Semua Tanggal</option>
                        <option>Hari Ini</option>
                        <option>Minggu Ini</option>
                    </select>
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-card border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none appearance-none"
                    >
                        <option value="all">Semua Status</option>
                        <option value="completed">Success</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="glass rounded-3xl overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30">ID & User</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30">Stasiun & Konektor</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30">Energi & Biaya</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30">Waktu</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30">Status</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions
                                .filter(trx => {
                                    const matchesSearch =
                                        trx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        trx.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        trx.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

                                    const matchesStatus =
                                        statusFilter === 'all' ||
                                        trx.status === statusFilter;

                                    return matchesSearch && matchesStatus;
                                })
                                .map((trx) => (
                                    <tr key={trx.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-sm">#{trx.id.substring(0, 8)}</p>
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
                                                {new Date(trx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-sm">{trx.user?.name || 'Unknown'}</p>
                                            <p className="text-xs text-white/40 mt-1">{trx.user?.email}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-medium">{trx.connector?.station?.name || 'Manual'}</p>
                                            <p className="text-[10px] text-primary uppercase font-bold mt-1">{trx.connector?.connector_type || 'EV'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-sm">Rp {new Intl.NumberFormat('id-ID').format(trx.total_cost || 0)}</p>
                                            <p className="text-[10px] text-white/30 uppercase mt-1">{trx.energy_kwh} kWh</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${trx.status === 'completed' || trx.status === 'paid' ? 'bg-primary/10 text-primary' : 'bg-white/10 text-white/40'
                                                }`}>
                                                {trx.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 bg-white/5 rounded-lg text-white/40 group-hover:text-white group-hover:bg-primary transition-all">
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination placeholder */}
                <div className="p-6 bg-white/[0.02] flex items-center justify-between">
                    <p className="text-xs text-white/30">Menampilkan 4 dari 1,280 transaksi</p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold disabled:opacity-30" disabled>Sebelumnya</button>
                        <button className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">Berikutnya</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

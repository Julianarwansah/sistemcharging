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
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [showModal, setShowModal] = useState(false);

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
                    <p className="text-foreground/50 mt-1 text-sm sm:text-base break-words">Daftar semua sesi charging dan pembayaran pengguna.</p>
                </div>
                <button
                    onClick={downloadCSV}
                    className="bg-foreground/5 text-foreground px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 border border-border hover:bg-foreground/10 transition-all w-full sm:w-auto"
                >
                    <Download className="w-5 h-5" />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari ID Transaksi atau User..."
                        className="w-full bg-card border border-border rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
                    <select className="w-full bg-card border border-border rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none appearance-none">
                        <option>Semua Tanggal</option>
                        <option>Hari Ini</option>
                        <option>Minggu Ini</option>
                    </select>
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-card border border-border rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none appearance-none"
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
                            <tr className="border-b border-border bg-foreground/[0.02]">
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-foreground/30">ID & User</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-foreground/30">Stasiun & Konektor</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-foreground/30">Energi & Biaya</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-foreground/30">Waktu</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-foreground/30">Status</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-foreground/30"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
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
                                    <tr key={trx.id} className="hover:bg-foreground/[0.01] transition-colors">
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-sm">#{trx.id.substring(0, 8)}</p>
                                            <p className="text-[10px] text-foreground/30 uppercase tracking-widest mt-1">
                                                {new Date(trx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-sm">{trx.user?.name || 'Unknown'}</p>
                                            <p className="text-xs text-foreground/40 mt-1">{trx.user?.email}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-medium">{trx.connector?.station?.name || 'Manual'}</p>
                                            <p className="text-[10px] text-primary uppercase font-bold mt-1">{trx.connector?.connector_type || 'EV'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-sm">Rp {new Intl.NumberFormat('id-ID').format(trx.total_cost || 0)}</p>
                                            <p className="text-[10px] text-foreground/30 uppercase mt-1">{trx.energy_kwh} kWh</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${trx.status === 'completed' || trx.status === 'paid' ? 'bg-primary/10 text-primary' : 'bg-foreground/10 text-foreground/40'
                                                }`}>
                                                {trx.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedTrx(trx);
                                                    setShowModal(true);
                                                }}
                                                className="p-2 bg-foreground/5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-primary transition-all"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination placeholder */}
                <div className="p-6 bg-foreground/[0.02] flex items-center justify-between">
                    <p className="text-xs text-foreground/30">Menampilkan 4 dari 1,280 transaksi</p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-foreground/5 rounded-xl text-xs font-bold disabled:opacity-30" disabled>Sebelumnya</button>
                        <button className="px-4 py-2 bg-foreground/5 rounded-xl text-xs font-bold hover:bg-foreground/10 transition-all">Berikutnya</button>
                    </div>
                </div>
            </div>

            {/* Transaction Detail Modal */}
            {showModal && selectedTrx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="glass rounded-[2rem] w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-300 overflow-hidden">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">Detail Transaksi</h2>
                                    <p className="text-foreground/40 text-sm mt-1">ID: {selectedTrx.id}</p>
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full ${selectedTrx.status === 'completed' || selectedTrx.status === 'paid' ? 'bg-primary/10 text-primary' : 'bg-foreground/10 text-foreground/40'}`}>
                                    {selectedTrx.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-2">Informasi Pengguna</p>
                                        <div className="bg-foreground/5 rounded-2xl p-4">
                                            <p className="font-bold">{selectedTrx.user?.name || 'Unknown'}</p>
                                            <p className="text-xs text-foreground/40 mt-1">{selectedTrx.user?.email || '-'}</p>
                                            <p className="text-xs text-foreground/40">{selectedTrx.user?.phone || '-'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-2">Lokasi Pengisian</p>
                                        <div className="bg-foreground/5 rounded-2xl p-4">
                                            <p className="font-bold">{selectedTrx.connector?.station?.name || 'Stasiun Manual'}</p>
                                            <p className="text-xs text-foreground/40 mt-1">{selectedTrx.connector?.station?.address || '-'}</p>
                                            <div className="flex gap-2 mt-3">
                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md font-bold uppercase">{selectedTrx.connector?.connector_type}</span>
                                                <span className="text-[10px] bg-foreground/10 text-foreground/60 px-2 py-1 rounded-md font-bold uppercase">{selectedTrx.connector?.power_kw} kW</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-2">Rincian Sesi</p>
                                        <div className="bg-foreground/5 rounded-2xl p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-foreground/40">Waktu Mulai</span>
                                                <span className="text-xs font-medium">{new Date(selectedTrx.created_at).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-foreground/40">Energi Terpakai</span>
                                                <span className="text-xs font-bold text-primary">{selectedTrx.energy_kwh} kWh</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-foreground/40">Harga per kWh</span>
                                                <span className="text-xs font-medium">Rp {new Intl.NumberFormat('id-ID').format(selectedTrx.connector?.price_per_kwh || 0)}</span>
                                            </div>
                                            <div className="pt-3 border-t border-border flex justify-between items-center">
                                                <span className="text-sm font-bold">Total Biaya</span>
                                                <span className="text-lg font-bold text-primary">Rp {new Intl.NumberFormat('id-ID').format(selectedTrx.total_cost || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-full bg-foreground/5 border border-border hover:bg-foreground/10 text-foreground py-3 rounded-xl font-bold transition-all text-sm"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

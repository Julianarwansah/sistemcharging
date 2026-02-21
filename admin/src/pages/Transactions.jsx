import React from 'react';
import {
    Search,
    Filter,
    Download,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight
} from 'lucide-react';

const transactions = [
    {
        id: 'TRX-9482',
        user: 'Budi Santoso',
        station: 'Pakuwon Mall Station',
        connector: 'Type 2 (AC)',
        amount: 'Rp 45.000',
        energy: '8.5 kWh',
        date: '21 Feb 2024, 14:20',
        status: 'Success'
    },
    {
        id: 'TRX-9481',
        user: 'Siti Aminah',
        station: 'Tunjungan Plaza C1',
        connector: 'CCS2 (DC)',
        amount: 'Rp 120.500',
        energy: '24.2 kWh',
        date: '21 Feb 2024, 13:45',
        status: 'Ongoing'
    },
    {
        id: 'TRX-9480',
        user: 'Agus Pratama',
        station: 'Galaxy Mall 3 P2',
        connector: 'Type 2 (AC)',
        amount: 'Rp 32.000',
        energy: '6.1 kWh',
        date: '21 Feb 2024, 12:10',
        status: 'Failed'
    },
    {
        id: 'TRX-9479',
        user: 'Rina Wijaya',
        station: 'Pakuwon Mall Station',
        connector: 'Type 2 (AC)',
        amount: 'Rp 54.000',
        energy: '10.2 kWh',
        date: '21 Feb 2024, 11:30',
        status: 'Success'
    },
];

export default function Transactions() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Riwayat Transaksi</h1>
                    <p className="text-white/50 mt-1">Daftar semua sesi charging dan pembayaran pengguna.</p>
                </div>
                <button className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all">
                    <Download className="w-5 h-5" />
                    Ekspor Laporan
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                    <input
                        type="text"
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
                    <select className="w-full bg-card border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none appearance-none">
                        <option>Semua Status</option>
                        <option>Success</option>
                        <option>Ongoing</option>
                        <option>Failed</option>
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="glass rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
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
                        {transactions.map((trx) => (
                            <tr key={trx.id} className="hover:bg-white/[0.01] transition-colors group">
                                <td className="px-8 py-6">
                                    <p className="font-bold text-sm">{trx.id}</p>
                                    <p className="text-xs text-white/40 mt-1">{trx.user}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="font-bold text-sm">{trx.station}</p>
                                    <p className="text-xs text-white/40 mt-1">{trx.connector}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="font-bold text-sm text-primary">{trx.amount}</p>
                                    <p className="text-xs text-white/40 mt-1">{trx.energy}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="text-sm font-medium">{trx.date}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className={`flex items-center gap-2 text-xs font-bold ${trx.status === 'Success' ? 'text-primary' :
                                            trx.status === 'Ongoing' ? 'text-blue-400' : 'text-red-400'
                                        }`}>
                                        {trx.status === 'Success' && <CheckCircle2 className="w-4 h-4" />}
                                        {trx.status === 'Ongoing' && <Clock className="w-4 h-4 animate-pulse" />}
                                        {trx.status === 'Failed' && <XCircle className="w-4 h-4" />}
                                        {trx.status}
                                    </div>
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

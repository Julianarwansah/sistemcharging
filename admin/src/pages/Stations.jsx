import React from 'react';
import {
    Plus,
    Search,
    MapPin,
    Power,
    MoreVertical,
    Edit2,
    Trash2,
    BatteryCharging
} from 'lucide-react';

const stations = [
    {
        id: 'ST001',
        name: 'Pakuwon Mall Station',
        address: 'Jl. Mayjend. Jonosewojo No.2, Surabaya',
        status: 'Active',
        connectors: 4,
        power: '22kW',
        usage: '85%'
    },
    {
        id: 'ST002',
        name: 'Tunjungan Plaza C1',
        address: 'Jl. Jenderal Basuki Rachmat No.8-12, Surabaya',
        status: 'Active',
        connectors: 6,
        power: '50kW',
        usage: '42%'
    },
    {
        id: 'ST003',
        name: 'Galaxy Mall 3 P2',
        address: 'Jl. Dharmahusada Indah Timur No.35-37, Surabaya',
        status: 'Maintenance',
        connectors: 2,
        power: '11kW',
        usage: '0%'
    },
    {
        id: 'ST004',
        name: 'Grand City Station',
        address: 'Jl. Walikota Mustajab No.1, Surabaya',
        status: 'Active',
        connectors: 4,
        power: '22kW',
        usage: '28%'
    },
];

export default function Stations() {
    return (
        <div className="space-y-6 sm:space-y-8 max-w-full overflow-x-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold break-words leading-tight">Manajemen Stasiun</h1>
                    <p className="text-white/50 mt-1 text-xs sm:text-base break-words">Kelola data stasiun charging dan konektor.</p>
                </div>
                <button className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto shrink-0">
                    <Plus className="w-5 h-5" />
                    Tambah Stasiun
                </button>
            </div>

            {/* Filters/Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Cari nama stasiun atau lokasi..."
                        className="w-full bg-card border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-colors text-sm sm:text-base"
                    />
                </div>
                <select className="bg-card border border-white/10 rounded-2xl px-6 py-3.5 text-sm font-medium focus:outline-none w-full sm:min-w-[200px] sm:w-auto">
                    <option>Semua Status</option>
                    <option>Active</option>
                    <option>Maintenance</option>
                    <option>Offline</option>
                </select>
            </div>

            {/* Stations List */}
            <div className="grid grid-cols-1 gap-4">
                {stations.map((station) => (
                    <div key={station.id} className="glass rounded-3xl p-6 hover:border-primary/20 transition-all group">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${station.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-500'
                                    }`}>
                                    <BatteryCharging className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold flex flex-wrap items-center gap-3">
                                        {station.name}
                                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${station.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-500'
                                            }`}>
                                            {station.status}
                                        </span>
                                    </h3>
                                    <p className="flex items-start gap-1.5 text-white/40 text-sm mt-1">
                                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{station.address}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-12 pl-0 lg:pl-12 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0">
                                <div className="min-w-[70px] sm:min-w-[80px]">
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Konektor</p>
                                    <p className="font-bold text-base sm:text-lg mt-1">{station.connectors}</p>
                                </div>
                                <div className="min-w-[70px] sm:min-w-[80px]">
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Daya</p>
                                    <p className="font-bold text-base sm:text-lg mt-1">{station.power}</p>
                                </div>
                                <div className="flex-1 min-w-[140px] sm:min-w-[150px]">
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Penggunaan</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: station.usage }}></div>
                                        </div>
                                        <p className="font-bold text-xs sm:text-sm whitespace-nowrap">{station.usage}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                                    <button className="flex-1 lg:flex-none p-2.5 sm:p-3 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all border border-white/5 lg:border-0 flex items-center justify-center">
                                        <Edit2 className="w-4 sm:w-5 h-4 sm:h-5" />
                                        <span className="ml-2 lg:hidden text-xs sm:text-sm font-medium">Edit</span>
                                    </button>
                                    <button className="flex-1 lg:flex-none p-2.5 sm:p-3 hover:bg-red-500/10 rounded-xl text-white/40 hover:text-red-500 transition-all border border-white/5 lg:border-0 flex items-center justify-center">
                                        <Trash2 className="w-4 sm:w-5 h-4 sm:h-5" />
                                        <span className="ml-2 lg:hidden text-xs sm:text-sm font-medium">Hapus</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

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
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Manajemen Stasiun</h1>
                    <p className="text-white/50 mt-1">Kelola data stasiun charging dan konektor alat.</p>
                </div>
                <button className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Plus className="w-5 h-5" />
                    Tambah Stasiun
                </button>
            </div>

            {/* Filters/Search */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Cari nama stasiun atau lokasi..."
                        className="w-full bg-card border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
                <select className="bg-card border border-white/10 rounded-2xl px-6 py-3.5 text-sm font-medium focus:outline-none min-w-[150px]">
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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${station.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-500'
                                    }`}>
                                    <BatteryCharging className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-3">
                                        {station.name}
                                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${station.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-500'
                                            }`}>
                                            {station.status}
                                        </span>
                                    </h3>
                                    <p className="flex items-center gap-1.5 text-white/40 text-sm mt-1">
                                        <MapPin className="w-4 h-4" />
                                        {station.address}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-12">
                                <div className="text-center">
                                    <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Konektor</p>
                                    <p className="font-bold text-lg mt-1">{station.connectors}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Daya</p>
                                    <p className="font-bold text-lg mt-1">{station.power}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Penggunaan</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: station.usage }}></div>
                                        </div>
                                        <p className="font-bold text-sm">{station.usage}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-3 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all">
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button className="p-3 hover:bg-red-500/10 rounded-xl text-white/40 hover:text-red-500 transition-all">
                                        <Trash2 className="w-5 h-5" />
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

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    MapPin,
    Power,
    MoreVertical,
    Edit2,
    Trash2,
    BatteryCharging,
    Loader2
} from 'lucide-react';
import { adminService } from '../services/api';

export default function Stations() {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        qr_code: '',
        connectors: [
            { connector_type: 'Type 2', power_kw: 3.3, price_per_kwh: 2500 }
        ]
    });
    const [editStation, setEditStation] = useState(null);

    useEffect(() => {
        fetchStations();
    }, []);

    const fetchStations = async () => {
        try {
            const res = await adminService.getStations();
            // Backend returns { "stations": [...], "total": X }
            setStations(res.data.stations || []);
        } catch (error) {
            console.error('Error fetching stations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus stasiun "${name}"?`)) {
            try {
                await adminService.deleteStation(id);
                fetchStations();
            } catch (error) {
                console.error('Error deleting station:', error);
                const errMsg = error.response?.data?.error || error.message || 'Silakan coba lagi.';
                alert(`Gagal menghapus stasiun: ${errMsg}`);
            }
        }
    };

    const handleAddConnector = () => {
        setFormData({
            ...formData,
            connectors: [...formData.connectors, { connector_type: 'Type 2', power_kw: 3.3, price_per_kwh: 2500 }]
        });
    };

    const handleRemoveConnector = (index) => {
        const newConnectors = formData.connectors.filter((_, i) => i !== index);
        setFormData({ ...formData, connectors: newConnectors });
    };

    const handleConnectorChange = (index, field, value) => {
        const newConnectors = [...formData.connectors];
        newConnectors[index][field] = field === 'connector_type' ? value : parseFloat(value);
        setFormData({ ...formData, connectors: newConnectors });
    };

    const handleEdit = (station) => {
        setEditStation(station);
        setFormData({
            name: station.name,
            address: station.address,
            latitude: station.latitude,
            longitude: station.longitude,
            qr_code: station.qr_code,
            connectors: station.connectors.map(c => ({
                id: c.id,
                connector_type: c.connector_type,
                power_kw: c.power_kw,
                price_per_kwh: c.price_per_kwh
            }))
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditStation(null);
        setFormData({
            name: '',
            address: '',
            latitude: '',
            longitude: '',
            qr_code: '',
            connectors: [{ connector_type: 'Type 2', power_kw: 3.3, price_per_kwh: 2500 }]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude)
            };

            if (editStation) {
                await adminService.updateStation(editStation.id, payload);
            } else {
                await adminService.createStation(payload);
            }

            setShowModal(false);
            resetForm();
            fetchStations();
        } catch (error) {
            console.error('Error saving station:', error);
            alert(`Gagal ${editStation ? 'memperbarui' : 'menambah'} stasiun: ` + (error.response?.data?.error || error.message));
        } finally {
            setIsSubmitting(false);
        }
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
                    <h1 className="text-2xl sm:text-3xl font-bold break-words leading-tight">Manajemen Stasiun</h1>
                    <p className="text-white/50 mt-1 text-xs sm:text-base break-words">Kelola data stasiun charging dan konektor.</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto shrink-0"
                >
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
                                    <p className="font-bold text-base sm:text-lg mt-1">{station.connectors?.length || 0}</p>
                                </div>
                                <div className="min-w-[70px] sm:min-w-[80px]">
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Daya</p>
                                    <p className="font-bold text-base sm:text-lg mt-1">{station.connectors?.[0]?.power_kw || '0'}kW</p>
                                </div>
                                <div className="flex-1 min-w-[140px] sm:min-w-[150px]">
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Penggunaan</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: '45%' }}></div>
                                        </div>
                                        <p className="font-bold text-xs sm:text-sm whitespace-nowrap">45%</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                                    <button
                                        onClick={() => handleEdit(station)}
                                        className="flex-1 lg:flex-none p-2.5 sm:p-3 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all border border-white/5 lg:border-0 flex items-center justify-center"
                                    >
                                        <Edit2 className="w-4 sm:w-5 h-4 sm:h-5" />
                                        <span className="ml-2 lg:hidden text-xs sm:text-sm font-medium">Edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(station.id, station.name)}
                                        className="flex-1 lg:flex-none p-2.5 sm:p-3 hover:bg-red-500/10 rounded-xl text-white/40 hover:text-red-500 transition-all border border-white/5 lg:border-0 flex items-center justify-center"
                                    >
                                        <Trash2 className="w-4 sm:w-5 h-4 sm:h-5" />
                                        <span className="ml-2 lg:hidden text-xs sm:text-sm font-medium">Hapus</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Tambah Stasiun */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="glass rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 animate-in fade-in zoom-in duration-300">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold mb-6">{editStation ? 'Edit Stasiun' : 'Tambah Stasiun Baru'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Nama Stasiun</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Stasiun Sudirman"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">QR Code</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                            value={formData.qr_code}
                                            onChange={e => setFormData({ ...formData, qr_code: e.target.value })}
                                            placeholder="STN-001"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Alamat</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Jl. Sudirman No. 12"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Latitude</label>
                                        <input
                                            required
                                            type="number"
                                            step="any"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                            value={formData.latitude}
                                            onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                                            placeholder="-6.12345"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Longitude</label>
                                        <input
                                            required
                                            type="number"
                                            step="any"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                            value={formData.longitude}
                                            onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                                            placeholder="106.12345"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Konektor</label>
                                        <button
                                            type="button"
                                            onClick={handleAddConnector}
                                            className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                                        >
                                            <Plus className="w-3 h-3" /> Tambah Konektor
                                        </button>
                                    </div>

                                    {formData.connectors.map((conn, index) => (
                                        <div key={index} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold">Konektor #{index + 1}</span>
                                                {formData.connectors.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveConnector(index)} className="text-red-500/50 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-white/30 uppercase font-bold">Tipe</label>
                                                    <select
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                                        value={conn.connector_type}
                                                        onChange={e => handleConnectorChange(index, 'connector_type', e.target.value)}
                                                    >
                                                        <option value="Type 2">Type 2</option>
                                                        <option value="CCS">CCS</option>
                                                        <option value="CHAdeMO">CHAdeMO</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-white/30 uppercase font-bold">Daya (kW)</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                                        value={conn.power_kw}
                                                        onChange={e => handleConnectorChange(index, 'power_kw', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-white/30 uppercase font-bold">Harga/kWh</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                                        value={conn.price_per_kwh}
                                                        onChange={e => handleConnectorChange(index, 'price_per_kwh', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-6 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {isSubmitting ? 'Menyimpan...' : (editStation ? 'Update Stasiun' : 'Simpan Stasiun')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

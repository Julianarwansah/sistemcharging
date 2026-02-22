import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Paintbrush, Globe, Loader2, Save, Key } from 'lucide-react';
import { adminService } from '../services/api';
import { getStoredAppearance, applyTheme, themes, accents } from '../utils/theme';
import { Sun, Moon, Zap, Palette, Monitor } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        system_name: '',
        default_price_per_kwh: '',
        currency: 'IDR',
        timezone: 'Asia/Jakarta'
    });
    const [appearance, setAppearance] = useState(getStoredAppearance());
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await adminService.getSettings();
            setSettings(res.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await adminService.updateSettings(settings);
            alert('Pengaturan berhasil diperbarui!');
        } catch (error) {
            alert('Gagal memperbarui pengaturan: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAppearanceChange = (type, value) => {
        const newAppearance = { ...appearance, [type]: value };
        setAppearance(newAppearance);
        applyTheme(newAppearance.theme, newAppearance.accent);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            alert('Konfirmasi kata sandi tidak cocok!');
            return;
        }

        setIsUpdating(true);
        try {
            await adminService.changePassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            alert('Kata sandi berhasil diubah!');
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            alert('Gagal mengubah kata sandi: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsUpdating(false);
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
            <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold break-words">Pengaturan Sistem</h1>
                <p className="text-white/50 mt-1 text-sm sm:text-base break-words">Konfigurasi parameter dan keamanan dashboard admin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    <TabButton
                        active={activeTab === 'general'}
                        onClick={() => setActiveTab('general')}
                        icon={Globe}
                        title="Umum"
                    />
                    <TabButton
                        active={activeTab === 'security'}
                        onClick={() => setActiveTab('security')}
                        icon={Shield}
                        title="Keamanan"
                    />
                    <TabButton
                        active={activeTab === 'notification'}
                        onClick={() => setActiveTab('notification')}
                        icon={Bell}
                        title="Notifikasi"
                    />
                    <TabButton
                        active={activeTab === 'display'}
                        onClick={() => setActiveTab('display')}
                        icon={Paintbrush}
                        title="Tampilan"
                    />
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-3">
                    {activeTab === 'general' && (
                        <div className="glass rounded-3xl p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <Globe className="w-6 h-6 text-primary" />
                                Pengaturan Umum
                            </h3>
                            <form onSubmit={handleUpdateSettings} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Nama Sistem</label>
                                        <input
                                            value={settings.system_name}
                                            onChange={e => setSettings({ ...settings, system_name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm"
                                            placeholder=" Charging Station Dashboard"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Harga Default per kWh (IDR)</label>
                                        <input
                                            type="number"
                                            value={settings.default_price_per_kwh}
                                            onChange={e => setSettings({ ...settings, default_price_per_kwh: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm"
                                            placeholder="2500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Mata Uang</label>
                                        <select
                                            value={settings.currency}
                                            onChange={e => setSettings({ ...settings, currency: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="IDR">IDR - Rupiah Indonesia</option>
                                            <option value="USD">USD - US Dollar</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Zona Waktu</label>
                                        <select
                                            value={settings.timezone}
                                            onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                                            <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                                            <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    disabled={isUpdating}
                                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    <Save className="w-5 h-5" />
                                    {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="glass rounded-3xl p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <Shield className="w-6 h-6 text-orange-500" />
                                Keamanan Akun
                            </h3>
                            <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Kata Sandi Saat Ini</label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.current_password}
                                            onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm"
                                        />
                                    </div>
                                    <div className="h-px bg-white/5 my-2"></div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Kata Sandi Baru</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={passwordData.new_password}
                                            onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm"
                                            placeholder="Minimal 6 karakter"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Konfirmasi Kata Sandi Baru</label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.confirm_password}
                                            onChange={e => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 text-sm"
                                        />
                                    </div>
                                </div>
                                <button
                                    disabled={isUpdating}
                                    className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20"
                                >
                                    <Key className="w-5 h-5" />
                                    {isUpdating ? 'Memproses...' : 'Ubah Kata Sandi'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'display' && (
                        <div className="glass rounded-3xl p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <Paintbrush className="w-6 h-6 text-primary" />
                                Kustomisasi Tampilan
                            </h3>

                            <div className="space-y-10">
                                {/* Theme Selection */}
                                <section className="space-y-4">
                                    <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest pl-1">Tema Sistem</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <ThemeOption
                                            active={appearance.theme === 'dark'}
                                            onClick={() => handleAppearanceChange('theme', 'dark')}
                                            title="Deep Sea (Dark)"
                                            desc="Tema klasik biru gelap"
                                            icon={Moon}
                                            previewClass="bg-[#0D1B2A]"
                                        />
                                        <ThemeOption
                                            active={appearance.theme === 'midnight'}
                                            onClick={() => handleAppearanceChange('theme', 'midnight')}
                                            title="Midnight (Abyss)"
                                            desc="Total hitam minimalis"
                                            icon={Monitor}
                                            previewClass="bg-[#050505]"
                                        />
                                        <ThemeOption
                                            active={appearance.theme === 'light'}
                                            onClick={() => handleAppearanceChange('theme', 'light')}
                                            title="Clean (Light)"
                                            desc="Tampilan cerah & segar"
                                            icon={Sun}
                                            previewClass="bg-[#F8FAFC]"
                                        />
                                    </div>
                                </section>

                                {/* Accent Color Selection */}
                                <section className="space-y-4">
                                    <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest pl-1">Warna Aksen</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {Object.entries(accents).map(([key, colors]) => (
                                            <button
                                                key={key}
                                                onClick={() => handleAppearanceChange('accent', key)}
                                                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative ${appearance.accent === key ? 'ring-2 ring-white scale-110 shadow-lg' : 'hover:scale-105 opacity-70 hover:opacity-100'
                                                    }`}
                                                style={{ backgroundColor: colors['--primary-color'] }}
                                            >
                                                {appearance.accent === key && <Palette className="w-6 h-6 text-white" />}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-white/30 italic mt-2">Warna ini akan digunakan untuk tombol, icon, dan elemen aktif lainnya.</p>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notification' && (
                        <div className="glass rounded-3xl p-12 text-center animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Bell className="w-10 h-10 text-white/20" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Tersedia Segera</h3>
                            <p className="text-white/40 text-sm">Fitur kustomisasi notifikasi sedang dalam tahap pengembangan.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="glass rounded-3xl p-8 mt-8 border border-primary/10">
                <h3 className="text-xl font-bold mb-4">Informasi Sistem</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-4 bg-white/5 rounded-2xl">
                        <p className="text-[10px] text-white/30 uppercase font-bold">API Version</p>
                        <p className="font-bold mt-1 text-primary">v1.2.0-stable</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl">
                        <p className="text-[10px] text-white/30 uppercase font-bold">Status Server</p>
                        <p className="font-bold mt-1 text-primary flex items-center gap-2">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                            Online (Running)
                        </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl">
                        <p className="text-[10px] text-white/30 uppercase font-bold">Basis Data</p>
                        <p className="font-bold mt-1">PostgreSQL 15 (Connected)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ThemeOption({ active, onClick, title, desc, icon: Icon, previewClass }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col gap-4 p-5 rounded-3xl border-2 transition-all text-left group ${active
                ? 'border-primary bg-primary/5'
                : 'border-white/5 hover:border-white/20 bg-white/5'
                }`}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${previewClass} border border-white/10 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${active ? 'text-primary' : 'text-white/40'}`} />
            </div>
            <div>
                <p className={`font-bold text-sm ${active ? 'text-primary' : ''}`}>{title}</p>
                <p className="text-xs text-white/40 mt-1">{desc}</p>
            </div>
        </button>
    );
}

function TabButton({ active, onClick, icon: Icon, title }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${active
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5'
                : 'hover:bg-white/5 text-white/60 hover:text-white'
                }`}
        >
            <Icon className="w-5 h-5" />
            <span className="font-bold text-sm">{title}</span>
        </button>
    );
}

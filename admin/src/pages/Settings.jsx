import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Paintbrush, Globe } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-6 sm:space-y-8 max-w-full overflow-x-hidden">
            <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold break-words">Pengaturan Sistem</h1>
                <p className="text-white/50 mt-1 text-sm sm:text-base break-words">Konfigurasi parameter dan tampilan dashboard admin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsCard icon={Globe} title="Umum" description="Nama sistem, mata uang, dan zona waktu." />
                <SettingsCard icon={Shield} title="Keamanan" description="Pengaturan API key dan enkripsi data." />
                <SettingsCard icon={Bell} title="Notifikasi" description="Atur jenis notifikasi ke grup WhatsApp/Email." />
                <SettingsCard icon={Paintbrush} title="Tampilan" description="Ubah tema warna dan logo dashboard." />
            </div>

            <div className="glass rounded-3xl p-8 mt-8 border border-primary/10">
                <h3 className="text-xl font-bold mb-4">Informasi Sistem</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-4 bg-white/5 rounded-2xl">
                        <p className="text-[10px] text-white/30 uppercase font-bold">API Version</p>
                        <p className="font-bold mt-1 text-primary">v1.0.0-build.2024</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl">
                        <p className="text-[10px] text-white/30 uppercase font-bold">Status Server</p>
                        <p className="font-bold mt-1 text-primary flex items-center gap-2">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                            Online (Running)
                        </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl">
                        <p className="text-[10px] text-white/30 uppercase font-bold">Database</p>
                        <p className="font-bold mt-1">PostgreSQL 15 (Connected)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsCard({ icon: Icon, title, description }) {
    return (
        <div className="glass rounded-3xl p-6 hover:border-primary/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:text-primary transition-colors">
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="text-sm text-white/40 mt-1">{description}</p>
                </div>
            </div>
        </div>
    );
}

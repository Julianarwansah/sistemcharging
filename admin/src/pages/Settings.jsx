import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Paintbrush, Globe } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Pengaturan Sistem</h1>
                <p className="text-white/50 mt-1">Konfigurasi parameter dan tampilan dashboard admin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsCard icon={Globe} title="Umum" description="Nama sistem, mata uang, dan zona waktu." />
                <SettingsCard icon={Shield} title="Keamanan" description="Pengaturan API key dan enkripsi data." />
                <SettingsCard icon={Bell} title="Notifikasi" description="Atur jenis notifikasi ke grup WhatsApp/Email." />
                <SettingsCard icon={Paintbrush} title="Tampilan" description="Ubah tema warna dan logo dashboard." />
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

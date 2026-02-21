import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Bell, Search, User } from 'lucide-react';

export default function AdminLayout() {
    return (
        <div className="flex min-h-screen">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-20 glass sticky top-0 z-10 px-8 flex items-center justify-between">
                    <div className="relative w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari stasiun atau transaksi..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors">
                            <Bell className="w-6 h-6 text-white/70" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                            <div className="text-right">
                                <p className="font-bold text-sm">Super Admin</p>
                                <p className="text-xs text-white/40">admin@sistemcharging.com</p>
                            </div>
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                                <User className="w-6 h-6 text-white/60" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

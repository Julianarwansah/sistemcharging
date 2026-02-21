import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    EvStation,
    History,
    Users,
    Settings,
    LogOut,
    Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: EvStation, label: 'Stasiun', path: '/stations' },
    { icon: History, label: 'Transaksi', path: '/transactions' },
    { icon: Users, label: 'Pengguna', path: '/users' },
    { icon: Settings, label: 'Pengaturan', path: '/settings' },
];

export default function Sidebar() {
    return (
        <aside className="w-64 bg-card border-r border-white border-opacity-[0.05] flex flex-col h-screen sticky top-0">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Zap className="text-white w-6 h-6" />
                </div>
                <span className="font-bold text-xl tracking-tight">Sistem<span className="text-primary">Charging</span></span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                            isActive
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <item.icon className={cn(
                            "w-5 h-5 transition-colors",
                            "group-hover:text-primary active:text-white"
                        )} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white border-opacity-[0.05]">
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-400/10 transition-colors duration-200">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Keluar</span>
                </button>
            </div>
        </aside>
    );
}

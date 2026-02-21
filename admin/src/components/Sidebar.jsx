import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    History,
    Users,
    Settings,
    LogOut,
    Zap,
    ShieldCheck,
    X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Zap, label: 'Stasiun', path: '/stations' },
    { icon: History, label: 'Transaksi', path: '/transactions' },
    { icon: Users, label: 'Pelanggan', path: '/users' },
    { icon: ShieldCheck, label: 'Administrator', path: '/admins' },
    { icon: Settings, label: 'Pengaturan', path: '/settings' },
];

export default function Sidebar({ isCollapsed, isMobileOpen, onMobileClose }) {
    return (
        <>
            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onMobileClose}
                />
            )}

            <aside className={cn(
                "fixed lg:sticky top-0 left-0 z-50 bg-card border-r border-white/5 flex flex-col h-screen transition-all duration-300",
                isCollapsed ? "w-20" : "w-64",
                isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className={cn(
                    "p-6 flex items-center justify-between",
                    isCollapsed && "justify-center px-0"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                            <Zap className="text-white w-6 h-6" />
                        </div>
                        {!isCollapsed && (
                            <span className="font-bold text-xl tracking-tight whitespace-nowrap">
                                Sistem<span className="text-primary">Charging</span>
                            </span>
                        )}
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        onClick={onMobileClose}
                        className="lg:hidden p-2 hover:bg-white/5 rounded-lg text-white/50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onMobileClose}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                isCollapsed && "justify-center px-0",
                                isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                            title={isCollapsed ? item.label : ""}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 shrink-0 transition-colors",
                                "group-hover:text-primary active:text-white"
                            )} />
                            {!isCollapsed && (
                                <span className="font-medium whitespace-nowrap">{item.label}</span>
                            )}

                            {/* Tooltip for Collapsed Mode (Simplified) */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-3 py-2 bg-card border border-white/10 rounded-lg text-xs font-bold text-white invisible group-hover:visible whitespace-nowrap z-50 shadow-2xl">
                                    {item.label}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className={cn(
                    "p-4 border-t border-white/5",
                    isCollapsed && "px-0"
                )}>
                    <button className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors duration-200 w-full",
                        isCollapsed && "justify-center px-0"
                    )}>
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span className="font-medium">Keluar</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}

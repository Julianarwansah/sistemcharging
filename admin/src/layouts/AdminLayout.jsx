import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Bell, Search, User, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function AdminLayout() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();

    // Close mobile sidebar when route changes
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex min-h-screen bg-background text-white overflow-x-hidden">
            <Sidebar
                isCollapsed={isCollapsed}
                isMobileOpen={isMobileOpen}
                onMobileClose={() => setIsMobileOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-20 bg-background/95 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-4">
                        {/* Desktop Collapse Toggle */}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="hidden lg:flex w-10 h-10 items-center justify-center hover:bg-white/5 rounded-xl transition-colors border border-white/10"
                        >
                            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                        </button>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMobileOpen(true)}
                            className="lg:hidden w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors border border-white/10"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="relative hidden md:block w-64 lg:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-6">
                        <button className="relative w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors">
                            <Bell className="w-6 h-6 text-white/70" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-3 lg:pl-6 border-l border-white/10">
                            <div className="text-right hidden sm:block">
                                <p className="font-bold text-sm">Super Admin</p>
                                <p className="text-xs text-white/40">admin@sistemcharging.com</p>
                            </div>
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10 shrink-0">
                                <User className="w-6 h-6 text-white/60" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

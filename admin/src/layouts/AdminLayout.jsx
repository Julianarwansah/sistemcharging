import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { adminService } from '../services/api';
import { Bell, Search, User, Menu, ChevronLeft, ChevronRight, LogOut, Settings, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function AdminLayout() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [admin, setAdmin] = useState(null);
    const [error, setError] = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const location = useLocation();

    useEffect(() => {
        fetchProfile();
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const fetchProfile = async () => {
        try {
            const res = await adminService.getProfile();
            setAdmin(res.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching admin profile:', error);
            setError(error.response?.status === 401 ? 'Unauthorized' : 'Error');
            if (error.response?.status === 401) {
                handleLogout();
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
    };

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

                        <div className="flex items-center gap-3 pl-3 lg:pl-6 border-l border-white/10 relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center gap-3 group text-left"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="font-bold text-sm group-hover:text-primary transition-colors">
                                        {admin?.name || (error ? 'Session Error' : 'Loading...')}
                                    </p>
                                    <p className="text-xs text-white/40">{admin?.email || (error ? 'Please re-login' : '...')}</p>
                                </div>
                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10 shrink-0 group-hover:border-primary/50 transition-all relative">
                                    <User className="w-6 h-6 text-white/60 group-hover:text-primary" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                                        <ChevronDown className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {showProfileDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-white/5 md:hidden">
                                        <p className="text-sm font-bold truncate">{admin?.name}</p>
                                        <p className="text-xs text-white/40 truncate">{admin?.email}</p>
                                    </div>
                                    <Link
                                        to="/settings"
                                        onClick={() => setShowProfileDropdown(false)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-white/70 hover:text-white"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Pengaturan Profil</span>
                                    </Link>
                                    <div className="h-px bg-white/5 my-1"></div>
                                    <button
                                        onClick={() => {
                                            setShowProfileDropdown(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-500"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Keluar</span>
                                    </button>
                                </div>
                            )}
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

import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { adminService } from '../services/api';
import { Bell, Search, User, Menu, ChevronLeft, ChevronRight, LogOut, Settings, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getStoredAppearance, applyTheme } from '../utils/theme';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function AdminLayout() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [admin, setAdmin] = useState(null);
    const [error, setError] = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);
    const location = useLocation();

    useEffect(() => {
        // Apply stored appearance
        const appearance = getStoredAppearance();
        applyTheme(appearance.theme, appearance.accent);

        fetchProfile();
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await adminService.getNotifications();
            setNotifications(res.data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotificationDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef, notificationRef]);

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

    // WebSocket for real-time notifications
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        const ws = new WebSocket(`ws://${window.location.hostname}:8080/api/v1/ws/admin${token ? `?token=${token}` : ''}`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'balance_update' || data.type === 'session_update' || data.status) {
                fetchNotifications();
                setHasUnread(true);
            }
        };
        return () => ws.close();
    }, []);

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
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => {
                                    setShowNotificationDropdown(!showNotificationDropdown);
                                    setHasUnread(false);
                                }}
                                className="relative w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors"
                            >
                                <Bell className="w-6 h-6 text-white/70" />
                                {hasUnread && (
                                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse"></span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotificationDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                                        <h3 className="text-sm font-bold">Aktivitas Terbaru</h3>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                                        {notifications.length > 0 ? (
                                            notifications.map((notif, i) => (
                                                <div key={i} className="px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.status === 'success' ? 'bg-primary' : notif.status === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold group-hover:text-primary transition-colors">{notif.title}</p>
                                                            <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{notif.message}</p>
                                                            <p className="text-[9px] text-white/30 mt-1 uppercase tracking-wider">
                                                                {new Date(notif.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.time).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center">
                                                <p className="text-xs text-white/30 italic">Tidak ada aktivitas terbaru.</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-4 py-2 text-center border-t border-white/5 bg-white/[0.01]">
                                        <button className="text-[10px] text-primary font-bold hover:underline">Lihat Semua Laporan</button>
                                    </div>
                                </div>
                            )}
                        </div>

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

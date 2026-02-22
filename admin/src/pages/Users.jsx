import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Mail, Phone, Calendar, MoreVertical, Loader2, XCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { adminService } from '../services/api';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [roleFilter] = useState('user'); // Exclusively for customers
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dropdownId, setDropdownId] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'user'
    });
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [userTransactions, setUserTransactions] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        fetchUsers();
        // Close dropdown when clicking outside
        const handleClickOutside = () => setDropdownId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await adminService.getCustomers();
            setUsers(res.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (user) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus pelanggan "${user.name}"?`)) {
            try {
                await adminService.deleteUser(user.id);
                fetchUsers();
                alert('Pelanggan berhasil dihapus.');
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Gagal menghapus pelanggan: ' + (error.response?.data?.error || error.message));
            }
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setEditFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role || 'user'
        });
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await adminService.updateUser(selectedUser.id, editFormData);
            alert('Data pelanggan berhasil diperbarui!');
            setShowEditModal(false);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Gagal memperbarui data: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchHistory = async (user) => {
        setLoadingHistory(true);
        setSelectedUser(user);
        setShowHistoryModal(true);
        try {
            const res = await adminService.getUserTransactions(user.id);
            setUserTransactions(res.data || []);
        } catch (error) {
            console.error('Error fetching history:', error);
            alert('Gagal mengambil riwayat transaksi.');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleTopUp = async (e) => {
        e.preventDefault();
        if (!selectedUser || !topUpAmount) return;

        setIsSubmitting(true);
        try {
            await adminService.adminTopUp(selectedUser.id, parseFloat(topUpAmount));
            setShowTopUpModal(false);
            setTopUpAmount('');
            setSelectedUser(null);
            fetchUsers();
            alert('Top up berhasil!');
        } catch (error) {
            console.error('Error top up:', error);
            alert('Gagal top up: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBlock = async (user) => {
        if (window.confirm(`Apakah Anda yakin ingin MEMBLOKIR pelanggan "${user.name}"? Pelanggan tidak akan bisa login.`)) {
            try {
                await adminService.blockUser(user.id);
                fetchUsers();
                alert('Pelanggan berhasil diblokir.');
            } catch (error) {
                alert('Gagal memblokir: ' + (error.response?.data?.error || error.message));
            }
        }
    };

    const handleUnblock = async (user) => {
        try {
            await adminService.unblockUser(user.id);
            fetchUsers();
            alert('Pelanggan berhasil diaktifkan kembali.');
        } catch (error) {
            alert('Gagal mengaktifkan: ' + (error.response?.data?.error || error.message));
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'online' && user.is_online) ||
            (statusFilter === 'offline' && !user.is_online);

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 max-w-full overflow-x-hidden text-wrap">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold break-words">Manajemen Pelanggan</h1>
                    <p className="text-foreground/50 mt-1 text-sm sm:text-base break-words">Daftar pelanggan terdaftar di sistem charging.</p>
                </div>
                <button className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto">
                    <UserPlus className="w-5 h-5" />
                    Tambah Pelanggan
                </button>
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Cari nama atau email pelanggan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card border border-border rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-card border border-border rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">Semua Status</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="blocked">Terblokir</option>
                    </select>
                </div>
            </div>

            <div className="glass rounded-3xl overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-border bg-foreground/[0.02]">
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-foreground/30">Nama & Email</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-foreground/30">Telepon</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-foreground/30 text-right">Saldo</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-foreground/30 text-center">Bergabung</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-foreground/30 text-center">Status</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-foreground/30 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-foreground/[0.01] transition-colors">
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-sm">{user.name}</p>
                                            <p className="text-xs text-foreground/40 mt-1">{user.email}</p>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-foreground/70">{user.phone || '-'}</td>
                                        <td className="px-8 py-6 text-sm text-foreground/70 text-right font-mono">
                                            Rp {user.balance?.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-8 py-6 text-sm text-foreground/70 text-center">
                                            {new Date(user.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${user.is_online ? 'bg-primary/10 text-primary' : 'bg-foreground/10 text-foreground/40'
                                                    }`}>
                                                    {user.is_online ? 'Online' : 'Offline'}
                                                </span>
                                                {user.status === 'blocked' && (
                                                    <span className="text-[9px] uppercase font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        <ShieldAlert className="w-3 h-3" /> Terblokir
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 relative">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowTopUpModal(true);
                                                    }}
                                                    className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-lg hover:bg-primary/20 transition-all"
                                                >
                                                    Top Up
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDropdownId(dropdownId === user.id ? null : user.id);
                                                    }}
                                                    className="p-2 hover:bg-foreground/5 rounded-lg text-foreground/40 transition-all"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                {dropdownId === user.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <button
                                                            onClick={() => fetchHistory(user)}
                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-foreground/5 transition-colors"
                                                        >
                                                            Lihat Riwayat
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-foreground/5 transition-colors"
                                                        >
                                                            Ubah Data
                                                        </button>
                                                        {user.status === 'blocked' ? (
                                                            <button
                                                                onClick={() => handleUnblock(user)}
                                                                className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-primary/5 transition-colors"
                                                            >
                                                                Aktifkan Kembali
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleBlock(user)}
                                                                className="w-full text-left px-4 py-2 text-sm text-orange-500 hover:bg-orange-500/5 transition-colors"
                                                            >
                                                                Blokir Akses
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/5 transition-colors"
                                                        >
                                                            Hapus Pelanggan
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-foreground/30 text-sm">
                                        Tidak ada pengguna yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Up Modal */}
            {showTopUpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowTopUpModal(false)}></div>
                    <div className="glass rounded-[2rem] w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-300">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold mb-2">Top Up Saldo</h2>
                            <p className="text-foreground/40 text-sm mb-6">Tambah saldo untuk {selectedUser?.name}</p>

                            <form onSubmit={handleTopUp} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Jumlah Saldo (Rp)</label>
                                    <input
                                        required
                                        type="number"
                                        min="1000"
                                        className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50"
                                        value={topUpAmount}
                                        onChange={e => setTopUpAmount(e.target.value)}
                                        placeholder="Contoh: 50000"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowTopUpModal(false)}
                                        className="flex-1 px-6 py-3 rounded-xl border border-border font-bold hover:bg-foreground/5 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Memproses...' : 'Konfirmasi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
                    <div className="glass rounded-[2rem] w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-300">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold mb-2">Ubah Data Pelanggan</h2>
                            <p className="text-foreground/40 text-sm mb-6">Perbarui informasi profil {selectedUser?.name}</p>

                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest pl-1">Nama Lengkap</label>
                                    <input
                                        required
                                        className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                        value={editFormData.name}
                                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                        placeholder="Nama Lengkap"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest pl-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                        value={editFormData.email}
                                        onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                        placeholder="user@charging.id"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest pl-1">Telepon</label>
                                    <input
                                        className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                        value={editFormData.phone}
                                        onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                                        placeholder="08123xxxx"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 px-6 py-3 rounded-xl border border-border font-bold hover:bg-foreground/5 transition-all text-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
                                    >
                                        {isSubmitting ? 'Memproses...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)}></div>
                    <div className="glass rounded-[2rem] w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-300 overflow-hidden">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">Riwayat Transaksi</h2>
                                    <p className="text-foreground/40 text-sm mt-1">Pelanggan: {selectedUser?.name}</p>
                                </div>
                                <button onClick={() => setShowHistoryModal(false)} className="text-foreground/20 hover:text-foreground transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto no-scrollbar space-y-3">
                                {loadingHistory ? (
                                    <div className="py-20 flex flex-col items-center gap-4 text-foreground/30">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                        <p className="text-xs">Memuat riwayat...</p>
                                    </div>
                                ) : userTransactions.length > 0 ? (
                                    userTransactions.map((trx) => (
                                        <div key={trx.id} className="bg-foreground/5 border border-border rounded-2xl p-4 flex items-center justify-between group hover:border-primary/20 transition-all">
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm">#{trx.id.substring(0, 8)}</p>
                                                <p className="text-[10px] text-foreground/40 mt-0.5">
                                                    {new Date(trx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} • {new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-[10px] text-primary font-bold uppercase mt-1">
                                                    {trx.session?.connector?.station?.name || 'Manual'} ({trx.session?.connector?.connector_type || 'EV'})
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm">Rp {new Intl.NumberFormat('id-ID').format(trx.amount || 0)}</p>
                                                <p className={`text-[9px] uppercase font-bold mt-1 px-2 py-0.5 rounded-md inline-block ${trx.status === 'success' ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-500'
                                                    }`}>
                                                    {trx.status}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center text-foreground/20">
                                        <p className="text-sm italic">Belum ada riwayat transaksi.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

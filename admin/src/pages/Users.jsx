import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Mail, Phone, Calendar, MoreVertical, Loader2 } from 'lucide-react';
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
                    <p className="text-white/50 mt-1 text-sm sm:text-base break-words">Daftar pelanggan terdaftar di sistem charging.</p>
                </div>
                <button className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto">
                    <UserPlus className="w-5 h-5" />
                    Tambah Pelanggan
                </button>
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Cari nama atau email pelanggan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-card border border-white/10 rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">Semua Status</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                    </select>
                </div>
            </div>

            <div className="glass rounded-3xl overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30">Nama & Email</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30">Telepon</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30 text-right">Saldo</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30 text-center">Bergabung</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30 text-center">Status</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-sm">{user.name}</p>
                                            <p className="text-xs text-white/40 mt-1">{user.email}</p>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-white/70">{user.phone || '-'}</td>
                                        <td className="px-8 py-6 text-sm text-white/70 text-right font-mono">
                                            Rp {user.balance?.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-8 py-6 text-sm text-white/70 text-center">
                                            {new Date(user.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${user.is_online ? 'bg-primary/10 text-primary' : 'bg-white/10 text-white/40'
                                                }`}>
                                                {user.is_online ? 'Online' : 'Offline'}
                                            </span>
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
                                                    className="p-2 hover:bg-white/5 rounded-lg text-white/40 transition-all"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                {dropdownId === user.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors"
                                                        >
                                                            Ubah Data
                                                        </button>
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
                                    <td colSpan="5" className="px-8 py-12 text-center text-white/30 text-sm">
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
                            <p className="text-white/40 text-sm mb-6">Tambah saldo untuk {selectedUser?.name}</p>

                            <form onSubmit={handleTopUp} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Jumlah Saldo (Rp)</label>
                                    <input
                                        required
                                        type="number"
                                        min="1000"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50"
                                        value={topUpAmount}
                                        onChange={e => setTopUpAmount(e.target.value)}
                                        placeholder="Contoh: 50000"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowTopUpModal(false)}
                                        className="flex-1 px-6 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all"
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
                            <p className="text-white/40 text-sm mb-6">Perbarui informasi profil {selectedUser?.name}</p>

                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Nama Lengkap</label>
                                    <input
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                        value={editFormData.name}
                                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                        placeholder="Nama Lengkap"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                        value={editFormData.email}
                                        onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                        placeholder="user@charging.id"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Telepon</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                        value={editFormData.phone}
                                        onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                                        placeholder="08123xxxx"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 px-6 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all text-sm"
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
        </div>
    );
}

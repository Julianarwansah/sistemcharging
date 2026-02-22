import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Mail, Phone, Calendar, MoreVertical, Loader2, ShieldCheck, ChevronDown } from 'lucide-react';
import { adminService } from '../services/api';

export default function AdminsPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'admin'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dropdownId, setDropdownId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const currentUser = JSON.parse(localStorage.getItem('admin_user') || '{}');

    useEffect(() => {
        fetchUsers();
        // Close dropdown when clicking outside
        const handleClickOutside = () => setDropdownId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await adminService.getAdmins();
            setUsers(res.data || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterOrUpdate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditing) {
                await adminService.updateUser(selectedId, formData);
                alert('Data administrator berhasil diperbarui!');
            } else {
                await adminService.registerAdmin(formData);
                alert('Administrator baru berhasil ditambahkan!');
            }
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            const errorData = error.response?.data;
            const message = errorData?.error || error.message;
            const details = errorData?.details;
            alert('Gagal: ' + message + (details ? '\nDetail: ' + details : ''));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (user) => {
        if (user.id === currentUser.id) {
            alert('Anda tidak dapat menghapus akun Anda sendiri.');
            return;
        }

        if (user.role === 'super_admin' && currentUser.role !== 'super_admin') {
            alert('Hanya Super Admin yang dapat menghapus Super Admin lainnya.');
            return;
        }

        if (window.confirm(`Apakah Anda yakin ingin menghapus admin "${user.name}"?`)) {
            try {
                await adminService.deleteUser(user.id);
                fetchUsers();
                alert('Admin berhasil dihapus.');
            } catch (error) {
                alert('Gagal menghapus admin: ' + (error.response?.data?.error || error.message));
            }
        }
    };

    const openEditModal = (user) => {
        setIsEditing(true);
        setSelectedId(user.id);
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            password: '', // Keep empty for update unless changed
            role: user.role
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', password: '', role: 'admin' });
        setIsEditing(false);
        setSelectedId(null);
    };

    const filteredAdmins = users.filter(user => {
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
                    <h1 className="text-2xl sm:text-3xl font-bold break-words">Manajemen Administrator</h1>
                    <p className="text-white/50 mt-1 text-sm sm:text-base break-words">Daftar administrator sistem.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto"
                >
                    <ShieldCheck className="w-5 h-5" />
                    Tambah Admin
                </button>
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Cari nama atau email admin..."
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
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30 text-center">Role</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30 text-center">Bergabung</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30 text-center">Status</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredAdmins.length > 0 ? (
                                filteredAdmins.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-sm">{user.name}</p>
                                            <p className="text-xs text-white/40 mt-1">{user.email}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-medium text-white/70">{user.phone || '-'}</p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${user.role === 'super_admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                                                }`}>
                                                {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                            </span>
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
                                            <div className="flex items-center justify-end relative">
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
                                                            Hapus Admin
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-8 py-12 text-center text-white/30 text-sm">
                                        Tidak ada admin yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tambah Admin Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="glass rounded-[2rem] w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-300">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold mb-2">{isEditing ? 'Ubah Administrator' : 'Tambah Administrator'}</h2>
                            <p className="text-white/40 text-sm mb-6">
                                {isEditing ? `Mengubah data untuk ${formData.name}` : 'Buat akun administrator baru untuk sistem.'}
                            </p>

                            <form onSubmit={handleRegisterOrUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                                <div className="sm:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Nama Lengkap</label>
                                    <input
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Nama Lengkap"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="admin@charging.id"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Telepon</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="08123xxxx"
                                    />
                                </div>
                                {!isEditing && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Kata Sandi</label>
                                        <input
                                            required
                                            type="password"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Min. 6 karakter"
                                        />
                                    </div>
                                )}
                                <div className={`space-y-1.5 ${isEditing ? 'sm:col-span-2' : ''}`}>
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Role</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 text-sm appearance-none cursor-pointer"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6 sm:col-span-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="flex-1 px-6 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all text-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
                                    >
                                        {isSubmitting ? 'Memproses...' : (isEditing ? 'Simpan Perubahan' : 'Simpan')}
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

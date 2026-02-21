import React from 'react';
import { Search, UserPlus, Mail, Phone, Calendar, MoreVertical } from 'lucide-react';

const users = [
    { id: 1, name: 'Budi Santoso', email: 'budi@example.com', phone: '08123456789', joined: 'Jan 2024', status: 'Active' },
    { id: 2, name: 'Siti Aminah', email: 'siti@example.com', phone: '08123456780', joined: 'Feb 2024', status: 'Active' },
    { id: 3, name: 'Andi Wijaya', email: 'andi@example.com', phone: '08123456781', joined: 'Feb 2024', status: 'Inactive' },
];

export default function UsersPage() {
    return (
        <div className="space-y-6 sm:space-y-8 max-w-full overflow-x-hidden text-wrap">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold break-words">Manajemen Pengguna</h1>
                    <p className="text-white/50 mt-1 text-sm sm:text-base break-words">Daftar pengguna terdaftar di sistem charging.</p>
                </div>
                <button className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto">
                    <UserPlus className="w-5 h-5" />
                    Tambah Pengguna
                </button>
            </div>

            <div className="glass rounded-3xl overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30">Nama & Email</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30">Telepon</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30">Bergabung</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30">Status</th>
                                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/30"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/[0.01] transition-colors">
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-sm">{user.name}</p>
                                        <p className="text-xs text-white/40 mt-1">{user.email}</p>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-white/70">{user.phone}</td>
                                    <td className="px-8 py-6 text-sm text-white/70">{user.joined}</td>
                                    <td className="px-8 py-6">
                                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${user.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-white/10 text-white/40'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 transition-all">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

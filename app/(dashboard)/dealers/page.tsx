"use client";

import React, { useState, useEffect } from "react";
import {
    Users,
    Search,
    UserPlus,
    Key,
    Trash2,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Building2,
    Phone,
    Mail,
    MapPin,
    AlertCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from "lucide-react";
import {
    fetchDealersAction,
    toggleDealerStatusAction,
    fetchDealerUsersAction,
    createDealerUserAction,
    deleteDealerUserAction
} from "@/app/actions/dealerActions";

export default function DealersPage() {
    const [dealers, setDealers] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [activeOnly, setActiveOnly] = useState(false);
    const [loading, setLoading] = useState(true);

    // Modal state for managing users
    const [selectedDealer, setSelectedDealer] = useState<any | null>(null);
    const [dealerUsers, setDealerUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Form state for creating a user
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
    const [userForm, setUserForm] = useState({
        username: "",
        email: "",
        password: "",
        fullName: "",
        phone: "",
        role: "CUSTOMER_OWNER"
    });
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const loadDealers = async () => {
        setLoading(true);
        try {
            const data = await fetchDealersAction(page, 15, search, activeOnly);
            if (data) {
                setDealers(data.content || []);
                setTotalPages(data.totalPages || 0);
                setTotalElements(data.totalElements || 0);
            }
        } catch (e) {
            console.error("Bayiler yüklenirken hata:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadDealers();
        }, 300);
        return () => clearTimeout(timeout);
    }, [page, search, activeOnly]);

    const handleToggleStatus = async (dealerId: number, currentStatus: boolean) => {
        try {
            await toggleDealerStatusAction(dealerId);
            setDealers(prev =>
                prev.map(d => (d.id === dealerId ? { ...d, bayiActive: !currentStatus } : d))
            );
        } catch (e) {
            console.error("Durum değiştirilemedi:", e);
        }
    };

    const handleOpenUserModal = async (dealer: any) => {
        setSelectedDealer(dealer);
        setLoadingUsers(true);
        setIsCreateUserOpen(false);
        try {
            const users = await fetchDealerUsersAction(dealer.id);
            setDealerUsers(users || []);
        } catch (e) {
            console.error("Kullanıcılar yüklenemedi:", e);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDealer) return;
        setFormSubmitting(true);
        setFormError(null);

        try {
            const created = await createDealerUserAction(selectedDealer.id, userForm);
            setDealerUsers(prev => [...prev, created]);
            setIsCreateUserOpen(false);
            setUserForm({
                username: "",
                email: "",
                password: "",
                fullName: "",
                phone: "",
                role: "CUSTOMER_OWNER"
            });
        } catch (err: any) {
            setFormError(err.message || "Kullanıcı oluşturulurken bir hata oluştu.");
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!selectedDealer || !confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
        try {
            await deleteDealerUserAction(selectedDealer.id, userId);
            setDealerUsers(prev => prev.filter(u => u.id !== userId));
        } catch (e) {
            console.error("Kullanıcı silinemedi:", e);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-600" />
                        Bayi & Cari Hesap Yönetimi
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Logo ERP cari kartlarını görüntüleyebilir, bayilik erişimini açıp kapatabilir ve bayilere ait kullanıcıları yönetebilirsiniz.
                    </p>
                </div>
                <button
                    onClick={loadDealers}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm cursor-pointer"
                >
                    <RefreshCw className="w-4 h-4" /> Yenile
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari Kodu, Ünvan veya Şehir Ara..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={activeOnly}
                            onChange={(e) => { setActiveOnly(e.target.checked); setPage(0); }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span>Sadece Açık Bayiler</span>
                    </label>

                    <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                        Toplam <span className="text-slate-900 font-bold">{totalElements}</span> Cari
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Logo Ref</th>
                                <th className="px-6 py-4 font-semibold">Cari Kodu</th>
                                <th className="px-6 py-4 font-semibold">Cari Ünvanı</th>
                                <th className="px-6 py-4 font-semibold">Şehir / İlçe</th>
                                <th className="px-6 py-4 font-semibold text-center">Bayi Erişimi</th>
                                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                            Cari hesaplar yükleniyor...
                                        </div>
                                    </td>
                                </tr>
                            ) : dealers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Arama kriterine uygun cari hesap bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                dealers.map((dealer) => (
                                    <tr key={dealer.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                            #{dealer.logoLogicalRef}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                                            {dealer.code}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900 max-w-xs truncate" title={dealer.definition}>
                                            {dealer.definition}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-600">
                                            {dealer.city || dealer.district ? `${dealer.city || ''} / ${dealer.district || ''}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(dealer.id, dealer.bayiActive)}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    dealer.bayiActive ? "bg-emerald-500" : "bg-slate-300"
                                                }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                        dealer.bayiActive ? "translate-x-5" : "translate-x-0"
                                                    }`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleOpenUserModal(dealer)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                            >
                                                <Users className="w-3.5 h-3.5" />
                                                Kullanıcıları Yönet
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <div className="text-xs text-slate-500">
                            Sayfa <span className="font-semibold">{page + 1}</span> / {totalPages} (Toplam {totalElements} Kayıt)
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white bg-white/50 text-slate-700 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                                className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white bg-white/50 text-slate-700 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dealer Users Modal */}
            {selectedDealer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-400" />
                                    {selectedDealer.definition}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                    Cari Kodu: {selectedDealer.code} | Logo Ref: #{selectedDealer.logoLogicalRef}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedDealer(null)}
                                className="text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
                            >
                                Kapat
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Action Bar */}
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-slate-900 text-sm">Tanımlı Bayi Kullanıcıları</h4>
                                {!isCreateUserOpen && (
                                    <button
                                        onClick={() => { setIsCreateUserOpen(true); setFormError(null); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        Yeni Kullanıcı Ekle
                                    </button>
                                )}
                            </div>

                            {/* Create User Form */}
                            {isCreateUserOpen && (
                                <form onSubmit={handleCreateUser} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                                    <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Yeni Bayi Kullanıcısı Tanımla</h5>

                                    {formError && (
                                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            {formError}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-700">Kullanıcı Adı *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Örn: bayi_yetkili"
                                                value={userForm.username}
                                                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                                className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-700">E-posta Adresi *</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="yetkili@firma.com"
                                                value={userForm.email}
                                                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                                className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-700">Ad Soyad</label>
                                            <input
                                                type="text"
                                                placeholder="Ad Soyad"
                                                value={userForm.fullName}
                                                onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                                                className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-700">Giriş Şifresi *</label>
                                            <input
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                value={userForm.password}
                                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                                className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreateUserOpen(false)}
                                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={formSubmitting}
                                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                                        >
                                            {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            Kullanıcıyı Kaydet
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Users List */}
                            <div className="space-y-3">
                                {loadingUsers ? (
                                    <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                        Kullanıcılar yükleniyor...
                                    </div>
                                ) : dealerUsers.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        Bu bayiye ait henüz tanımlı bir kullanıcı bulunmuyor.
                                    </div>
                                ) : (
                                    dealerUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 text-sm">
                                                        {user.fullName || user.username}
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                        {user.role}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center gap-3 font-mono">
                                                    <span>Kullanıcı: {user.username}</span>
                                                    <span>•</span>
                                                    <span>E-posta: {user.email}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                title="Kullanıcıyı Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

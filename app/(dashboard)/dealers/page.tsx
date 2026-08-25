"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
    Building2,
    Users,
    Search,
    Shield,
    CheckCircle2,
    XCircle,
    UserPlus,
    Key,
    Trash2,
    Edit3,
    AlertCircle,
    Check,
    X,
    Loader2,
    Briefcase,
    RefreshCw
} from "lucide-react";
import { dealerService, CariDto, UserDto, DealerUserRequest } from "@/app/services/dealerService";

export default function DealersPage() {
    const [dealers, setDealers] = useState<CariDto[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [bayiActiveFilter, setBayiActiveFilter] = useState<boolean | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Modal state for managing users of a Cari
    const [selectedDealer, setSelectedDealer] = useState<CariDto | null>(null);
    const [dealerUsers, setDealerUsers] = useState<UserDto[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    // Form state for creating/editing a user
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserDto | null>(null);
    const [userForm, setUserForm] = useState<DealerUserRequest>({
        fullName: "",
        email: "",
        username: "",
        password: "",
        phone: "",
        role: "CUSTOMER_OWNER",
        status: "ACTIVE"
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [formSubmitting, setFormSubmitting] = useState(false);

    const loadDealers = async () => {
        setLoading(true);
        try {
            const data = await dealerService.getDealers({
                bayiActive: bayiActiveFilter,
                search: search.trim() || undefined,
                page,
                size: 15
            });
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
        loadDealers();
    }, [page, bayiActiveFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        loadDealers();
    };

    const handleToggleStatus = async (dealer: CariDto) => {
        try {
            const updated = await dealerService.toggleStatus(dealer.id);
            setDealers(prev => prev.map(d => d.id === dealer.id ? { ...d, bayiActive: updated.bayiActive } : d));
        } catch (e: any) {
            alert("Durum güncellenirken hata oluştu: " + e.message);
        }
    };

    const handleOpenUserModal = async (dealer: CariDto) => {
        setSelectedDealer(dealer);
        setIsUserModalOpen(true);
        setIsFormOpen(false);
        setFormError(null);
        setLoadingUsers(true);
        try {
            const users = await dealerService.getDealerUsers(dealer.id);
            setDealerUsers(users || []);
        } catch (e) {
            console.error("Kullanıcılar alınırken hata:", e);
            setDealerUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleOpenCreateUser = () => {
        setEditingUser(null);
        setUserForm({
            fullName: "",
            email: "",
            username: "",
            password: "",
            phone: "",
            role: "CUSTOMER_OWNER",
            status: "ACTIVE"
        });
        setFormError(null);
        setIsFormOpen(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDealer) return;
        setFormSubmitting(true);
        setFormError(null);

        try {
            if (editingUser) {
                // Update user
                const updated = await dealerService.updateUser((editingUser as any).id || (editingUser as any).userId, userForm);
                setDealerUsers(prev => prev.map(u => u.username === editingUser.username ? { ...u, ...updated } : u));
            } else {
                // Create user
                const created = await dealerService.createUserForDealer(selectedDealer.id, userForm);
                setDealerUsers(prev => [...prev, created]);
                // update count in dealer list
                setDealers(prev => prev.map(d => d.id === selectedDealer.id ? { ...d, userCount: d.userCount + 1 } : d));
            }
            setIsFormOpen(false);
        } catch (err: any) {
            setFormError(err.message || "Kullanıcı kaydedilirken bir hata oluştu.");
        } finally {
            setFormSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-red-600" />
                        Bayi & Cari Hesap Yönetimi
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Logo ERP'deki cari hesapların bayi portalı erişimlerini açıp kapatabilir, bayilere ait kullanıcıları yönetebilirsiniz.
                    </p>
                </div>
                <button
                    onClick={loadDealers}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" /> Yenile
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari Kodu, Ünvan veya Grup Kodu ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-slate-50/50"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        Ara
                    </button>
                </form>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => { setBayiActiveFilter(undefined); setPage(0); }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${bayiActiveFilter === undefined ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Tümü ({totalElements})
                    </button>
                    <button
                        onClick={() => { setBayiActiveFilter(true); setPage(0); }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${bayiActiveFilter === true ? 'bg-emerald-600 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Bayiliği Açık Olanlar
                    </button>
                    <button
                        onClick={() => { setBayiActiveFilter(false); setPage(0); }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${bayiActiveFilter === false ? 'bg-rose-600 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Bayiliği Kapalı Olanlar
                    </button>
                </div>
            </div>

            {/* Dealers Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Logo Ref</th>
                                <th className="px-6 py-4 font-semibold">Cari Kodu</th>
                                <th className="px-6 py-4 font-semibold">Cari Ünvan</th>
                                <th className="px-6 py-4 font-semibold">Grup</th>
                                <th className="px-6 py-4 font-semibold text-center">Bayi Girişi</th>
                                <th className="px-6 py-4 font-semibold text-center">Kullanıcılar</th>
                                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                                            Yükleniyor...
                                        </div>
                                    </td>
                                </tr>
                            ) : dealers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        Eşleşen cari hesap bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                dealers.map((dealer) => (
                                    <tr key={dealer.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                            {dealer.logoLogicalRef || '-'}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                                            {dealer.code}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 max-w-xs truncate" title={dealer.definition}>
                                                {dealer.definition}
                                            </div>
                                            {(dealer.city || dealer.phone) && (
                                                <div className="text-xs text-slate-400 mt-0.5">
                                                    {dealer.city && <span>{dealer.city} </span>}
                                                    {dealer.phone && <span>• {dealer.phone}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                                {dealer.groupCode || 'GENEL'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleToggleStatus(dealer)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                                    dealer.bayiActive
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                                }`}
                                            >
                                                {dealer.bayiActive ? (
                                                    <>
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        Açık
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                                        Kapalı
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                                <Users className="w-3 h-3 text-slate-500" />
                                                {dealer.userCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleOpenUserModal(dealer)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
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
                            Sayfa <span className="font-semibold">{page + 1}</span> / {totalPages} (Toplam {totalElements} Cari)
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium disabled:opacity-40 hover:bg-white bg-white/50"
                            >
                                Önceki
                            </button>
                            <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium disabled:opacity-40 hover:bg-white bg-white/50"
                            >
                                Sonraki
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for Managing Users of Selected Cari */}
            {isUserModalOpen && selectedDealer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-red-600" />
                                    {selectedDealer.definition}
                                </h3>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">
                                    Cari Kodu: {selectedDealer.code} | Logo Ref: {selectedDealer.logoLogicalRef || '-'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsUserModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {!isFormOpen ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-slate-900 text-sm">Tanımlı Bayi Kullanıcıları</h4>
                                            <p className="text-xs text-slate-500">Bu bayinin portalına erişebilen yetkililer ve çalışanlar</p>
                                        </div>
                                        <button
                                            onClick={handleOpenCreateUser}
                                            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Yeni Kullanıcı Tanımla
                                        </button>
                                    </div>

                                    {loadingUsers ? (
                                        <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                                            Kullanıcılar yükleniyor...
                                        </div>
                                    ) : dealerUsers.length === 0 ? (
                                        <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div className="text-sm font-semibold text-slate-800">Henüz kullanıcı tanımlanmamış</div>
                                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                                Bu cari hesabın bayi portalına giriş yapabilmesi için "Yeni Kullanıcı Tanımla" butonuna basarak ilk bayi sahibini/yetkilisini oluşturun.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                                            {dealerUsers.map((user, idx) => (
                                                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-900 text-sm">
                                                                {user.fullName || user.username}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                user.role === 'CUSTOMER_OWNER'
                                                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                                            }`}>
                                                                {user.role === 'CUSTOMER_OWNER' ? 'BAYİ SAHİBİ / YETKİLİ' : 'PERSONEL'}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-3">
                                                            <span>Kullanıcı Adı: <strong className="font-mono text-slate-700">{user.username}</strong></span>
                                                            <span>•</span>
                                                            <span>E-posta: {user.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Create User Form */
                                <form onSubmit={handleSaveUser} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                        <h4 className="font-bold text-slate-900 text-sm">
                                            {editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Bayi Kullanıcısı Tanımla'}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => setIsFormOpen(false)}
                                            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                                        >
                                            Vazgeç
                                        </button>
                                    </div>

                                    {formError && (
                                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            {formError}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-700">Ad Soyad</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Örn: Ahmet Yılmaz"
                                                value={userForm.fullName}
                                                onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                                                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-700">E-posta Adresi</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="ornek@bayi.com"
                                                value={userForm.email}
                                                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-700">Kullanıcı Adı</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="kullanici_adi"
                                                value={userForm.username}
                                                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-700">Şifre</label>
                                            <input
                                                type="password"
                                                required={!editingUser}
                                                placeholder={editingUser ? "Değiştirmek istemiyorsanız boş bırakın" : "••••••••"}
                                                value={userForm.password}
                                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-700">Telefon</label>
                                            <input
                                                type="text"
                                                placeholder="05XX XXX XX XX"
                                                value={userForm.phone}
                                                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                                                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-700">Yetki Rolü</label>
                                            <select
                                                value={userForm.role}
                                                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                            >
                                                <option value="CUSTOMER_OWNER">Bayi Sahibi / Yetkili (Alt Kullanıcı Ekleyebilir)</option>
                                                <option value="CUSTOMER_STAFF">Bayi Personeli (Sadece Sipariş Verebilir)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsFormOpen(false)}
                                            className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={formSubmitting}
                                            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                                        >
                                            {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            Kullanıcıyı Kaydet
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

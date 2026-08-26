"use client";

import React, { useState, useEffect } from "react";
import {
    ShoppingCart,
    Clock,
    CheckCircle2,
    AlertCircle,
    Eye,
    X,
    FileText,
    Building2,
    RefreshCw,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Ban,
    Trash2,
    Check,
    Send,
    Percent,
    Tag,
    Package,
    Calendar,
    TrendingUp,
    Receipt,
    ShieldCheck,
    User,
    ExternalLink,
    Layers
} from "lucide-react";
import {
    fetchDealerOrdersAction,
    fetchDealerOrderDetailAction,
    cancelOrderAction,
    deleteOrderAction,
    updateOrderStatusAction
} from "@/app/actions/dealerActions";
import { toast } from "sonner";

export default function DealerOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [syncStatus, setSyncStatus] = useState("");
    const [loading, setLoading] = useState(true);

    // Order detail modal state
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await fetchDealerOrdersAction(page, 15, search, syncStatus);
            if (data) {
                setOrders(data.content || []);
                setTotalPages(data.totalPages || 0);
                setTotalElements(data.totalElements || 0);
            }
        } catch (e) {
            console.error("Siparişler yüklenirken hata:", e);
            toast.error("Siparişler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadOrders();
        }, 300);
        return () => clearTimeout(timeout);
    }, [page, search, syncStatus]);

    const handleOpenDetail = async (order: any) => {
        try {
            const detail = await fetchDealerOrderDetailAction(order.id);
            setSelectedOrder(detail || order);
        } catch (e) {
            setSelectedOrder(order);
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        setActionLoading(true);
        try {
            const res = await cancelOrderAction(orderId, "Yönetici tarafından iptal edildi");
            if (res.success) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "CANCELLED", syncStatus: "CANCELLED" } : o));
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder({ ...selectedOrder, status: "CANCELLED", syncStatus: "CANCELLED" });
                }
                toast.warning("Sipariş başarıyla iptal edildi.");
            } else {
                toast.error(res.message || "Sipariş iptal edilemedi.");
            }
        } catch (e: any) {
            console.error("İptal hatası:", e);
            toast.error(e.message || "İptal sırasında bir hata oluştu.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteOrder = async (orderId: number) => {
        setActionLoading(true);
        try {
            const res = await deleteOrderAction(orderId);
            if (res.success) {
                setOrders(prev => prev.filter(o => o.id !== orderId));
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder(null);
                }
                toast.success("Sipariş başarıyla silindi.");
            } else {
                toast.error(res.message || "Sipariş silinemedi.");
            }
        } catch (e: any) {
            console.error("Silme hatası:", e);
            toast.error(e.message || "Silme sırasında bir hata oluştu.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: number, newStatus: string) => {
        setActionLoading(true);
        try {
            const res = await updateOrderStatusAction(orderId, newStatus);
            if (res.success) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder({ ...selectedOrder, status: newStatus });
                }
                toast.success("Sipariş durumu başarıyla güncellendi.");
            } else {
                toast.error(res.message || "Durum güncellenemedi.");
            }
        } catch (e: any) {
            console.error("Durum güncelleme hatası:", e);
            toast.error(e.message || "Durum güncellenirken bir hata oluştu.");
        } finally {
            setActionLoading(false);
        }
    };

    const formatMoney = (val: number, currency: string = "TL") => {
        return Number(val || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency;
    };

    return (
        <div className="space-y-8 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-blue-600" />
                        Bayi Siparişleri
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Bayilerin B2B portalı üzerinden verdiği siparişleri yönetebilir, durumlarını güncelleyebilir veya iptal edebilirsiniz.
                    </p>
                </div>
                <button
                    onClick={loadOrders}
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
                        placeholder="Sipariş No, Bayi Adı veya Cari Kodu Ara..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                        value={syncStatus}
                        onChange={(e) => { setSyncStatus(e.target.value); setPage(0); }}
                        className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Tüm Durumlar</option>
                        <option value="PENDING">Onay Bekliyor</option>
                        <option value="PROCESSING">Hazırlanıyor</option>
                        <option value="SUCCESS">Faturalandı & Tamamlandı</option>
                        <option value="CANCELLED">İptal Edilenler</option>
                    </select>

                    <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg whitespace-nowrap">
                        Toplam <span className="text-slate-900 font-bold">{totalElements}</span> Sipariş
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Sipariş No</th>
                                <th className="px-6 py-4 font-semibold">Bayi / Cari Ünvanı</th>
                                <th className="px-6 py-4 font-semibold">Tarih</th>
                                <th className="px-6 py-4 font-semibold">Kalem</th>
                                <th className="px-6 py-4 font-semibold">Toplam Tutar</th>
                                <th className="px-6 py-4 font-semibold text-center">Durum</th>
                                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                            Siparişler yükleniyor...
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        Henüz bir bayi siparişi bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                            {order.orderNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{order.cariName}</div>
                                            <div className="text-xs text-slate-400 font-mono">
                                                {order.cariCode} {order.userFullName ? `• ${order.userFullName}` : ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                                            {order.orderDate ? new Date(order.orderDate).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-700">
                                            <span className="font-bold text-slate-900">{order.items?.length || 0}</span> Çeşit
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-blue-600 text-sm">
                                            {formatMoney(order.grandTotal, order.currency)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <OrderStatusBadge status={order.status || order.syncStatus} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenDetail(order)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                                    title="Detay"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Detay
                                                </button>
                                                {order.status !== "CANCELLED" && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Siparişi İptal Et"
                                                    >
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Siparişi Tamamen Sil"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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
                            Sayfa <span className="font-semibold">{page + 1}</span> / {totalPages} (Toplam {totalElements} Sipariş)
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

            {/* Order Detail Modal (Wide, Modern & Spacious) */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4.5 border-b border-slate-800 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-600/30">
                                    <ShoppingCart className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="text-lg font-black text-white font-mono tracking-tight">
                                            {selectedOrder.orderNumber}
                                        </h3>
                                        <OrderStatusBadge status={selectedOrder.status || selectedOrder.syncStatus} />
                                        {selectedOrder.isEdited && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Düzenlenmiş Sipariş
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        <span className="font-semibold text-slate-200">{selectedOrder.cariName}</span>
                                        <span className="mx-2 text-slate-600">•</span>
                                        <span className="font-mono text-blue-400 font-bold">{selectedOrder.cariCode}</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Kapat"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Actions & Status Control Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Sipariş Durumunu Güncelle:
                                    </span>
                                    <select
                                        disabled={actionLoading}
                                        value={selectedOrder.status || "PENDING_SYNC"}
                                        onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                                        className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                    >
                                        <option value="PENDING_SYNC">⏳ Onay Bekliyor</option>
                                        <option value="PROCESSING">📦 Hazırlanıyor</option>
                                        <option value="SYNCED_TO_LOGO">✅ Onaylandı (Logo'ya Aktarıldı)</option>
                                        <option value="COMPLETED">🎉 Faturalandı & Tamamlandı</option>
                                        <option value="CANCELLED">❌ İptal Edildi</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    {selectedOrder.status !== "CANCELLED" && (
                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleCancelOrder(selectedOrder.id)}
                                            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            <Ban className="w-3.5 h-3.5" />
                                            Siparişi İptal Et
                                        </button>
                                    )}

                                    <button
                                        disabled={actionLoading}
                                        onClick={() => handleDeleteOrder(selectedOrder.id)}
                                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Sil
                                    </button>
                                </div>
                            </div>

                            {/* Cancellation / Edit Alerts */}
                            {selectedOrder.status === "CANCELLED" && (selectedOrder.cancelReason || selectedOrder.syncMessage) && (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                                    <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-bold text-rose-900">İptal Nedeni & Detayı:</div>
                                        <p className="mt-0.5">{selectedOrder.cancelReason || selectedOrder.syncMessage}</p>
                                    </div>
                                </div>
                            )}

                            {selectedOrder.isEdited && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 flex items-start gap-2.5">
                                    <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-bold text-blue-900">Düzenlenmiş Sipariş (Bayi Tarafından Tekrar Onaya Gönderildi)</div>
                                        <p className="mt-0.5">
                                            Bu siparişte bayi tarafından adet veya kalem değişikliği yapılmıştır.
                                            {selectedOrder.lastEditedAt && ` Son Değişiklik Zamanı: ${new Date(selectedOrder.lastEditedAt).toLocaleString("tr-TR")}`}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 3-Column Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                {/* Card 1: Bayi & Müşteri */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs pb-1 border-b border-slate-200/80">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                        Bayi / Müşteri Bilgileri
                                    </div>
                                    <div className="space-y-1">
                                        <div className="font-bold text-slate-900">{selectedOrder.cariName}</div>
                                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                                            <span>Kod: <strong className="text-blue-600">{selectedOrder.cariCode}</strong></span>
                                            {selectedOrder.cariTier && (
                                                <span className="px-2 py-0.2 rounded font-black bg-blue-100 text-blue-800 text-[10px]">
                                                    ⭐ {selectedOrder.cariTier} Grubu
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-600 flex items-center gap-1 pt-1">
                                            <User className="w-3 h-3 text-slate-400" />
                                            <span>{selectedOrder.userFullName || selectedOrder.userEmail || "Yetkili"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: Sipariş & Kur */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs pb-1 border-b border-slate-200/80">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        Sipariş & Kur Bilgileri
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-slate-700">
                                            Tarih: <strong className="text-slate-900">{new Date(selectedOrder.orderDate).toLocaleString("tr-TR")}</strong>
                                        </div>
                                        <div className="text-slate-700 flex items-center gap-1.5 font-mono">
                                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Sipariş Kuru: <strong>1 $ = {Number(selectedOrder.exchangeRate || 1).toFixed(4)} ₺</strong></span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 pt-1">
                                            Toplam <strong>{selectedOrder.items?.length || 0}</strong> farklı kalem ürün
                                        </div>
                                    </div>
                                </div>

                                {/* Card 3: Bayi Notu & Sevkiyat */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs pb-1 border-b border-slate-200/80">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        Bayi Notu & Açıklaması
                                    </div>
                                    <div>
                                        {selectedOrder.notes ? (
                                            <p className="text-slate-800 italic bg-white p-2 rounded-xl border border-slate-200/80 text-[11px]">
                                                &quot;{selectedOrder.notes}&quot;
                                            </p>
                                        ) : (
                                            <p className="text-slate-400 italic text-[11px]">Özel bir sipariş notu iletilmedi.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-blue-600" />
                                    Sipariş Kalemleri ({selectedOrder.items?.length || 0})
                                </h4>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-semibold">
                                            <tr>
                                                <th className="px-5 py-3.5">Ürün Kodu & Adı</th>
                                                <th className="px-4 py-3.5 text-right">Liste Fiyatı</th>
                                                <th className="px-4 py-3.5 text-center">İskonto Oranı</th>
                                                <th className="px-4 py-3.5 text-right">Net Birim Fiyat</th>
                                                <th className="px-4 py-3.5 text-center">Miktar</th>
                                                <th className="px-4 py-3.5 text-right">KDV</th>
                                                <th className="px-5 py-3.5 text-right">Toplam Tutar (TL)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedOrder.items?.map((item: any, idx: number) => {
                                                const origCurr = item.originalCurrency || "$";
                                                const isForeign = origCurr && !origCurr.includes("TL") && !origCurr.includes("₺");
                                                const origPrice = Number(item.originalPrice || item.unitPrice || 0);
                                                const rate = Number(item.exchangeRate || 1);
                                                const hasDiscount = (Number(item.discountRate) || 0) > 0;
                                                const discountedOrigPrice = hasDiscount ? origPrice * (100 - Number(item.discountRate)) / 100 : origPrice;

                                                const lineTotalTL = Number(item.totalPrice || 0);
                                                const listLineTotalTL = (origPrice * rate * Number(item.quantity || 1)) * (1 + Number(item.vatRate || 20) / 100);
                                                const lineSavingsTL = Math.max(0, listLineTotalTL - lineTotalTL);

                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                                        {/* Product Info */}
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-bold text-blue-600 text-xs">{item.productCode}</span>
                                                                {item.logoItemLogicalRef && (
                                                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                                                        Ref: {item.logoItemLogicalRef}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="font-semibold text-slate-900 text-xs truncate max-w-sm mt-0.5" title={item.productName}>
                                                                {item.productName}
                                                            </div>
                                                        </td>

                                                        {/* Original List Price */}
                                                        <td className="px-4 py-3.5 text-right">
                                                            <div className={`font-mono font-bold text-xs ${hasDiscount ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                                {isForeign ? formatMoney(origPrice, origCurr) : formatMoney(origPrice, "TL")}
                                                            </div>
                                                            {isForeign && (
                                                                <div className="text-[10px] text-slate-400 font-mono">
                                                                    ({formatMoney(origPrice * rate, "TL")})
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Discount Rate Badge */}
                                                        <td className="px-4 py-3.5 text-center">
                                                            {hasDiscount ? (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono shadow-2xs">
                                                                    -%{item.discountRate}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 font-mono">-</span>
                                                            )}
                                                        </td>

                                                        {/* Net Unit Price */}
                                                        <td className="px-4 py-3.5 text-right">
                                                            <div className="font-mono font-black text-slate-900 text-xs">
                                                                {formatMoney(item.unitPrice, "TL")}
                                                            </div>
                                                            {isForeign && hasDiscount && (
                                                                <div className="text-[10px] text-emerald-700 font-mono font-semibold">
                                                                    {formatMoney(discountedOrigPrice, origCurr)}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Quantity */}
                                                        <td className="px-4 py-3.5 text-center font-bold text-slate-900 text-xs font-mono">
                                                            {item.quantity} Adet
                                                        </td>

                                                        {/* VAT Rate */}
                                                        <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                                                            %{item.vatRate || 20}
                                                        </td>

                                                        {/* Total Price (TL) */}
                                                        <td className="px-5 py-3.5 text-right">
                                                            <div className="font-mono font-black text-blue-600 text-sm">
                                                                {formatMoney(item.totalPrice, "TL")}
                                                            </div>
                                                            {hasDiscount && lineSavingsTL > 0 && (
                                                                <div className="text-[10px] font-mono text-emerald-600 font-bold">
                                                                    -{formatMoney(lineSavingsTL, "TL")}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Financial Summary & Integration Box */}
                            {(() => {
                                const listSubTotal = (selectedOrder.items || []).reduce((acc: number, it: any) => {
                                    const orig = Number(it.originalPrice || it.unitPrice || 0);
                                    const rate = Number(it.exchangeRate || 1);
                                    const qty = Number(it.quantity || 0);
                                    return acc + (orig * rate * qty);
                                }, 0);
                                const discountSavings = Math.max(0, listSubTotal - Number(selectedOrder.totalAmount || 0));

                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                                        {/* Left Side: ERP & System Details */}
                                        <div className="md:col-span-7 space-y-3">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                    <Layers className="w-4 h-4 text-blue-600" />
                                                    Logo Tiger / Go 3 ERP Aktarım Bilgileri
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                                                    <div className="text-slate-600">
                                                        Logo Sipariş No: <strong className="text-slate-900 font-mono">{selectedOrder.logoOrderNumber || "Henüz Aktarılmadı"}</strong>
                                                    </div>
                                                    <div className="text-slate-600">
                                                        Logo Logical Ref: <strong className="text-slate-900 font-mono">{selectedOrder.logoOrderLogicalRef || "-"}</strong>
                                                    </div>
                                                    <div className="text-slate-600">
                                                        Cari Logical Ref: <strong className="text-slate-900 font-mono">{selectedOrder.cariLogoLogicalRef || "-"}</strong>
                                                    </div>
                                                    <div className="text-slate-600">
                                                        Aktarım Durumu: <strong className="text-blue-700">{selectedOrder.syncStatus || "Bekliyor"}</strong>
                                                    </div>
                                                </div>
                                                {selectedOrder.syncedAt && (
                                                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                                                        Son Aktarım Zamanı: {new Date(selectedOrder.syncedAt).toLocaleString("tr-TR")}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Side: Detailed Financial Totals */}
                                        <div className="md:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                                            {selectedOrder.originalTotalAmount && selectedOrder.originalCurrency && !selectedOrder.originalCurrency.includes("TL") && (
                                                <div className="flex justify-between text-blue-900 bg-blue-50/90 p-2.5 rounded-xl border border-blue-200 font-bold">
                                                    <span>Orijinal Döviz Tutarı:</span>
                                                    <span className="font-mono">{formatMoney(selectedOrder.originalTotalAmount, selectedOrder.originalCurrency)}</span>
                                                </div>
                                            )}

                                            {discountSavings > 0 && (
                                                <div className="flex justify-between text-slate-500">
                                                    <span>Liste Fiyatları Toplamı:</span>
                                                    <span className="font-mono font-semibold line-through">{formatMoney(listSubTotal, "TL")}</span>
                                                </div>
                                            )}

                                            {discountSavings > 0 && (
                                                <div className="flex justify-between text-emerald-800 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200 font-bold">
                                                    <span className="flex items-center gap-1">
                                                        <Tag className="w-3.5 h-3.5" />
                                                        Toplam İskonto Kazancı:
                                                    </span>
                                                    <span className="font-mono">-{formatMoney(discountSavings, "TL")}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between text-slate-600 pt-1">
                                                <span>Net Ara Toplam (TL):</span>
                                                <span className="font-mono font-bold text-slate-800">{formatMoney(selectedOrder.totalAmount, "TL")}</span>
                                            </div>

                                            <div className="flex justify-between text-slate-600">
                                                <span>Toplam KDV (TL):</span>
                                                <span className="font-mono font-medium text-slate-700">{formatMoney(selectedOrder.totalVat, "TL")}</span>
                                            </div>

                                            <div className="flex justify-between text-slate-900 font-bold text-sm pt-3 border-t border-slate-200 items-baseline">
                                                <span>Genel Sipariş Tutarı:</span>
                                                <span className="font-mono text-blue-600 font-black text-xl">{formatMoney(selectedOrder.grandTotal, "TL")}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function OrderStatusBadge({ status }: { status: string }) {
    if (status === "COMPLETED" || status === "INVOICED") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Faturalandı
            </span>
        );
    }

    if (status === "SYNCED_TO_LOGO" || status === "SUCCESS") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                Onaylandı
            </span>
        );
    }

    if (status === "PROCESSING") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Hazırlanıyor
            </span>
        );
    }

    if (status === "CANCELLED") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <Ban className="w-3.5 h-3.5 text-rose-600" />
                İptal Edildi
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Onay Bekliyor
        </span>
    );
}

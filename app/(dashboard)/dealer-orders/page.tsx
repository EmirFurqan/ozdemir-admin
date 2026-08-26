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
    Package
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

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    Sipariş: <span className="font-mono text-blue-400">{selectedOrder.orderNumber}</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                    {selectedOrder.cariName} ({selectedOrder.cariCode})
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Actions & Status Control Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mevcut Durum</div>
                                    <div className="mt-1">
                                        <OrderStatusBadge status={selectedOrder.status || selectedOrder.syncStatus} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        disabled={actionLoading}
                                        value={selectedOrder.status || "PENDING_SYNC"}
                                        onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="PENDING_SYNC">Onay Bekliyor</option>
                                        <option value="PROCESSING">Hazırlanıyor</option>
                                        <option value="SYNCED_TO_LOGO">Onaylandı</option>
                                        <option value="COMPLETED">Faturalandı & Tamamlandı</option>
                                        <option value="CANCELLED">İptal Edildi</option>
                                    </select>

                                    {selectedOrder.status !== "CANCELLED" && (
                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleCancelOrder(selectedOrder.id)}
                                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            İptal Et
                                        </button>
                                    )}

                                    <button
                                        disabled={actionLoading}
                                        onClick={() => handleDeleteOrder(selectedOrder.id)}
                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        Sil
                                    </button>
                                </div>
                            </div>

                            {/* Cancellation Reason Alert */}
                            {selectedOrder.status === "CANCELLED" && (selectedOrder.cancelReason || selectedOrder.syncMessage) && (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
                                    <div className="font-bold flex items-center gap-1.5 text-rose-900">
                                        <Ban className="w-4 h-4 text-rose-600" />
                                        <span>İptal Nedeni & Açıklaması:</span>
                                    </div>
                                    <p className="font-medium pl-5">{selectedOrder.cancelReason || selectedOrder.syncMessage}</p>
                                </div>
                            )}

                            {/* Edited Order Alert */}
                            {selectedOrder.isEdited && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 space-y-1">
                                    <div className="font-bold flex items-center gap-1.5 text-blue-900">
                                        <Clock className="w-4 h-4 text-blue-600" />
                                        <span>Düzenlenmiş Sipariş (Tekrar Onay Bekliyor)</span>
                                    </div>
                                    <p className="font-medium pl-5">
                                        Bu sipariş bayi tarafından güncellenmiş ve onayınıza sunulmuştur.
                                        {selectedOrder.lastEditedAt && ` Son Değişiklik: ${new Date(selectedOrder.lastEditedAt).toLocaleString("tr-TR")}`}
                                    </p>
                                </div>
                            )}

                            {/* Info grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                                <div>
                                    <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Bayi / Siparişi Veren:</span>
                                    <div className="font-bold text-slate-900 mt-0.5">{selectedOrder.cariName}</div>
                                    <div className="text-slate-600 font-mono">{selectedOrder.userFullName || selectedOrder.userEmail}</div>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Sipariş Tarihi:</span>
                                    <div className="font-medium text-slate-800 mt-0.5">
                                        {new Date(selectedOrder.orderDate).toLocaleString("tr-TR")}
                                    </div>
                                </div>
                                {selectedOrder.notes && (
                                    <div className="col-span-2 pt-2 border-t border-slate-200">
                                        <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Bayi Notu:</span>
                                        <div className="text-slate-800 mt-0.5 italic">{selectedOrder.notes}</div>
                                    </div>
                                )}
                            </div>

                            {/* Items Table */}
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-blue-600" />
                                    Sipariş Kalemleri ({selectedOrder.items?.length || 0})
                                </h4>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Ürün</th>
                                                <th className="px-4 py-3 font-semibold text-right">Liste Fiyatı</th>
                                                <th className="px-4 py-3 font-semibold text-center">İskonto</th>
                                                <th className="px-4 py-3 font-semibold text-right">Net Birim (TL)</th>
                                                <th className="px-4 py-3 font-semibold text-center">Miktar</th>
                                                <th className="px-4 py-3 font-semibold text-right">KDV</th>
                                                <th className="px-4 py-3 font-semibold text-right">Toplam (TL)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedOrder.items?.map((item: any, idx: number) => {
                                                const origCurr = item.originalCurrency || "$";
                                                const isForeign = origCurr && !origCurr.includes("TL") && !origCurr.includes("₺");
                                                const origPrice = item.originalPrice || item.unitPrice;
                                                const hasDiscount = (item.discountRate || 0) > 0;

                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-3">
                                                            <div className="font-mono font-bold text-blue-600 text-[11px]">{item.productCode}</div>
                                                            <div className="font-semibold text-slate-900 truncate max-w-xs">{item.productName}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className={`font-mono font-bold ${hasDiscount ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                                {isForeign ? formatMoney(origPrice, origCurr) : formatMoney(origPrice, "TL")}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {hasDiscount ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                                                                    -%{item.discountRate}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 font-mono">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-slate-900 font-bold">
                                                            {formatMoney(item.unitPrice, "TL")}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-slate-900">
                                                            {item.quantity} Adet
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                                                            %{item.vatRate}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-blue-600 text-sm">
                                                            {formatMoney(item.totalPrice, "TL")}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            {(() => {
                                const listSubTotal = (selectedOrder.items || []).reduce((acc: number, it: any) => {
                                    const orig = Number(it.originalPrice || it.unitPrice || 0);
                                    const rate = Number(it.exchangeRate || 1);
                                    const qty = Number(it.quantity || 0);
                                    return acc + (orig * rate * qty);
                                }, 0);
                                const discountSavings = Math.max(0, listSubTotal - Number(selectedOrder.totalAmount || 0));

                                return (
                                    <div className="flex justify-end pt-2">
                                        <div className="w-full sm:w-80 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                                            {selectedOrder.originalTotalAmount && selectedOrder.originalCurrency && !selectedOrder.originalCurrency.includes("TL") && (
                                                <div className="flex justify-between text-blue-800 bg-blue-50/80 p-2.5 rounded-xl border border-blue-200 font-bold">
                                                    <span>Orijinal Döviz Tutarı:</span>
                                                    <span className="font-mono">{formatMoney(selectedOrder.originalTotalAmount, selectedOrder.originalCurrency)}</span>
                                                </div>
                                            )}
                                            {discountSavings > 0 && (
                                                <div className="flex justify-between text-slate-500">
                                                    <span>Liste Toplamı:</span>
                                                    <span className="font-mono font-semibold line-through">{formatMoney(listSubTotal, "TL")}</span>
                                                </div>
                                            )}
                                            {discountSavings > 0 && (
                                                <div className="flex justify-between text-emerald-700 bg-emerald-50/70 p-2 rounded-xl border border-emerald-200 font-bold">
                                                    <span className="flex items-center gap-1">
                                                        <Tag className="w-3.5 h-3.5" />
                                                        İskonto İndirimi:
                                                    </span>
                                                    <span className="font-mono">-{formatMoney(discountSavings, "TL")}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-slate-600">
                                                <span>Net Ara Toplam (TL):</span>
                                                <span className="font-mono font-bold text-slate-800">{formatMoney(selectedOrder.totalAmount, "TL")}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>Toplam KDV (TL):</span>
                                                <span className="font-mono font-medium text-slate-700">{formatMoney(selectedOrder.totalVat, "TL")}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-900 font-bold text-sm pt-2.5 border-t border-slate-200">
                                                <span>Sipariş Tutarı (TL):</span>
                                                <span className="font-mono text-blue-600 font-black text-lg">{formatMoney(selectedOrder.grandTotal, "TL")}</span>
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

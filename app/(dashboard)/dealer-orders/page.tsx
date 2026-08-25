"use client";

import React, { useState, useEffect } from "react";
import {
    ShoppingCart,
    Search,
    Clock,
    CheckCircle2,
    AlertCircle,
    Eye,
    X,
    FileText,
    Building2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
    Package
} from "lucide-react";
import {
    fetchDealerOrdersAction,
    fetchDealerOrderDetailAction
} from "@/app/actions/dealerActions";

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
    const [loadingDetail, setLoadingDetail] = useState(false);

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

    const handleOpenDetail = async (orderId: number) => {
        setLoadingDetail(true);
        try {
            const detail = await fetchDealerOrderDetailAction(orderId);
            setSelectedOrder(detail);
        } catch (e) {
            console.error("Sipariş detayı yüklenemedi:", e);
        } finally {
            setLoadingDetail(false);
        }
    };

    const formatMoney = (val: number, currency: string = "TL") => {
        return Number(val || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-blue-600" />
                        Bayi Siparişleri & Logo Sync
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Bayilerden gelen tüm siparişleri ve Logo ERP'ye aktarım durumlarını buradan anlık olarak izleyebilirsiniz.
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
                        placeholder="Sipariş No, Bayi Kodu veya Ünvan Ara..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <select
                        value={syncStatus}
                        onChange={(e) => { setSyncStatus(e.target.value); setPage(0); }}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                        <option value="">Tüm Durumlar</option>
                        <option value="PENDING">Logo Aktarımı Bekleyenler</option>
                        <option value="SUCCESS">Logo'ya Aktarılanlar</option>
                        <option value="FAILED">Aktarımı Başarısız Olanlar</option>
                    </select>

                    <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
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
                                <th className="px-6 py-4 font-semibold">Tarih</th>
                                <th className="px-6 py-4 font-semibold">Bayi / Cari</th>
                                <th className="px-6 py-4 font-semibold">Kalem</th>
                                <th className="px-6 py-4 font-semibold">Toplam Tutar</th>
                                <th className="px-6 py-4 font-semibold text-center">Logo Sync</th>
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
                                        Herhangi bir bayi siparişi bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                                            {order.orderNumber}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                                            {order.orderDate ? new Date(order.orderDate).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 max-w-xs truncate" title={order.cariName}>
                                                {order.cariName}
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-mono">
                                                {order.cariCode} (Logo Ref: #{order.logoLogicalRef})
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                                            {order.items?.length || 0} Kalem
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                                            {formatMoney(order.grandTotal, order.currency)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <SyncStatusBadge status={order.syncStatus} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleOpenDetail(order.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Detay
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    Sipariş #{selectedOrder.orderNumber}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {selectedOrder.cariName} ({selectedOrder.cariCode}) • {new Date(selectedOrder.orderDate).toLocaleString("tr-TR")}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
                            >
                                Kapat
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Sync Status Banner */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div>
                                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Logo Entegrasyon Durumu</div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <SyncStatusBadge status={selectedOrder.syncStatus} />
                                        {selectedOrder.logoOrderNumber && (
                                            <span className="text-xs font-mono font-bold text-slate-700">
                                                Fiş No: {selectedOrder.logoOrderNumber} (Logo Ref: #{selectedOrder.logoOrderLogicalRef})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {selectedOrder.syncMessage && (
                                    <div className="text-xs text-rose-600 max-w-sm">
                                        <strong>Hata:</strong> {selectedOrder.syncMessage}
                                    </div>
                                )}
                            </div>

                            {/* Items Table */}
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm mb-3">Sipariş Kalemleri ({selectedOrder.items?.length || 0})</h4>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3">Ürün Kodu</th>
                                                <th className="px-4 py-3">Ürün Adı</th>
                                                <th className="px-4 py-3">Logo Ref</th>
                                                <th className="px-4 py-3 text-center">Miktar</th>
                                                <th className="px-4 py-3 text-right">Birim Fiyat</th>
                                                <th className="px-4 py-3 text-right">KDV</th>
                                                <th className="px-4 py-3 text-right">Toplam</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedOrder.items?.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{item.productCode}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-900">{item.productName}</td>
                                                    <td className="px-4 py-3 font-mono text-slate-500">#{item.logoItemLogicalRef}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-slate-900">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right font-mono">{formatMoney(item.unitPrice, item.currency)}</td>
                                                    <td className="px-4 py-3 text-right font-mono">%{item.vatRate}</td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">{formatMoney(item.totalPrice, item.currency)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Summary & Notes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <h5 className="font-semibold text-xs text-slate-700 uppercase mb-1">Sipariş Notu:</h5>
                                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        {selectedOrder.notes || "Not belirtilmedi."}
                                    </p>
                                </div>
                                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Ara Toplam (KDV Hariç):</span>
                                        <span className="font-mono font-medium">{formatMoney(selectedOrder.totalAmount, selectedOrder.currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Toplam KDV:</span>
                                        <span className="font-mono font-medium">{formatMoney(selectedOrder.totalVat, selectedOrder.currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                                        <span>Genel Toplam:</span>
                                        <span className="font-mono text-blue-600">{formatMoney(selectedOrder.grandTotal, selectedOrder.currency)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SyncStatusBadge({ status }: { status: string }) {
    if (status === "SUCCESS") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Logo'ya Aktarıldı
            </span>
        );
    }

    if (status === "FAILED") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Aktarım Hatası
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Logo Bekliyor
        </span>
    );
}

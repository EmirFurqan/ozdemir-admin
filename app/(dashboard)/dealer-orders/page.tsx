"use client";

import React, { useState, useEffect } from "react";
import {
    ShoppingCart,
    Search,
    RefreshCw,
    Clock,
    CheckCircle2,
    AlertCircle,
    Eye,
    X,
    Building2,
    Calendar,
    FileText,
    Loader2,
    DollarSign
} from "lucide-react";
import { orderService, OrderDto } from "@/app/services/orderService";

export default function DealerOrdersPage() {
    const [orders, setOrders] = useState<OrderDto[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [syncStatusFilter, setSyncStatusFilter] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    // Selected order for Detail Modal
    const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await orderService.getOrders({
                syncStatus: syncStatusFilter,
                search: search.trim() || undefined,
                page,
                size: 15
            });
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
        loadOrders();
    }, [page, syncStatusFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        loadOrders();
    };

    const formatMoney = (val: number, currency: string = "TL") => {
        if (val === undefined || val === null) return "0.00 " + currency;
        return Number(val).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency;
    };

    return (
        <div className="space-y-8 max-w-7xl font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-red-600" />
                        Bayi Siparişleri & Logo Sync
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Bayilerin portaldan oluşturduğu tüm siparişleri ve Logo ERP'ye aktarım durumlarını buradan takip edebilirsiniz.
                    </p>
                </div>
                <button
                    onClick={loadOrders}
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
                            placeholder="Sipariş No, Bayi Adı veya Cari Kodu ara..."
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

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => { setSyncStatusFilter(undefined); setPage(0); }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${syncStatusFilter === undefined ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Tümü ({totalElements})
                    </button>
                    <button
                        onClick={() => { setSyncStatusFilter("PENDING"); setPage(0); }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${syncStatusFilter === "PENDING" ? 'bg-amber-500 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Logo Bekleyenler
                    </button>
                    <button
                        onClick={() => { setSyncStatusFilter("SUCCESS"); setPage(0); }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${syncStatusFilter === "SUCCESS" ? 'bg-emerald-600 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Logo'ya Aktarılanlar
                    </button>
                    <button
                        onClick={() => { setSyncStatusFilter("FAILED"); setPage(0); }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${syncStatusFilter === "FAILED" ? 'bg-rose-600 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Hatalı Olanlar
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Sipariş No</th>
                                <th className="px-6 py-4 font-semibold">Tarih</th>
                                <th className="px-6 py-4 font-semibold">Bayi / Cari Bilgisi</th>
                                <th className="px-6 py-4 font-semibold">Toplam Tutar</th>
                                <th className="px-6 py-4 font-semibold text-center">Logo Durumu</th>
                                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                                            Siparişler yükleniyor...
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Henüz sipariş bulunmuyor.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                            {order.orderNumber}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                                            {order.orderDate ? new Date(order.orderDate).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 max-w-xs truncate" title={order.cariName}>
                                                {order.cariName}
                                            </div>
                                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                                                Cari Kodu: {order.cariCode} {order.userFullName && `• ${order.userFullName}`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                            {formatMoney(order.grandTotal, order.currency)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <SyncStatusBadge status={order.syncStatus} logoFicheNo={order.logoOrderNumber} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
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

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-red-600" />
                                    Sipariş Detayı: <span className="font-mono text-red-600">{selectedOrder.orderNumber}</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Tarih: {new Date(selectedOrder.orderDate).toLocaleString("tr-TR")}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Dealer & Logo Sync Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                                <div className="space-y-1.5">
                                    <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500">Bayi Bilgileri</div>
                                    <div className="font-semibold text-slate-900 text-sm">{selectedOrder.cariName}</div>
                                    <div className="font-mono text-slate-600">Cari Kodu: {selectedOrder.cariCode}</div>
                                    <div className="font-mono text-slate-600">Logo Logical Ref: {selectedOrder.cariLogoLogicalRef || '-'}</div>
                                    {selectedOrder.userFullName && (
                                        <div className="text-slate-600">Siparişi Veren: {selectedOrder.userFullName} ({selectedOrder.userEmail})</div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-500">Logo Entegrasyon Durumu</div>
                                    <div className="pt-0.5">
                                        <SyncStatusBadge status={selectedOrder.syncStatus} logoFicheNo={selectedOrder.logoOrderNumber} />
                                    </div>
                                    {selectedOrder.logoOrderLogicalRef && (
                                        <div className="font-mono text-slate-600">Logo ORFICHE Ref: {selectedOrder.logoOrderLogicalRef}</div>
                                    )}
                                    {selectedOrder.syncedAt && (
                                        <div className="text-slate-600">Aktarım Tarihi: {new Date(selectedOrder.syncedAt).toLocaleString("tr-TR")}</div>
                                    )}
                                    {selectedOrder.syncMessage && (
                                        <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                                            Hata: {selectedOrder.syncMessage}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Items Table */}
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm mb-3">Sipariş Kalemleri ({selectedOrder.items?.length || 0})</h4>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3">Ürün Kodu</th>
                                                <th className="px-4 py-3">Ürün Adı</th>
                                                <th className="px-4 py-3 text-center">Logo Ref</th>
                                                <th className="px-4 py-3 text-center">Miktar</th>
                                                <th className="px-4 py-3 text-right">Birim Fiyat</th>
                                                <th className="px-4 py-3 text-right">KDV</th>
                                                <th className="px-4 py-3 text-right">Toplam</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedOrder.items?.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-mono font-medium text-slate-800">{item.productCode}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-900">{item.productName}</td>
                                                    <td className="px-4 py-3 text-center font-mono text-slate-500">{item.logoItemLogicalRef || '-'}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-slate-900">{item.quantity} Adet</td>
                                                    <td className="px-4 py-3 text-right font-mono">{formatMoney(item.unitPrice, item.currency)}</td>
                                                    <td className="px-4 py-3 text-right font-mono">%{item.vatRate}</td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatMoney(item.totalPrice, item.currency)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Notes and Totals */}
                            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
                                <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                                    <div className="font-semibold text-slate-700 mb-1">Sipariş Notu:</div>
                                    <p className="text-slate-600">{selectedOrder.notes || "Not eklenmemiş."}</p>
                                </div>

                                <div className="w-full sm:w-64 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
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
                                        <span className="font-mono text-red-600">{formatMoney(selectedOrder.grandTotal, selectedOrder.currency)}</span>
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

function SyncStatusBadge({ status, logoFicheNo }: { status: string; logoFicheNo?: string }) {
    if (status === "SUCCESS") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Logo'ya Aktarıldı {logoFicheNo && `(${logoFicheNo})`}
            </span>
        );
    }

    if (status === "FAILED") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Logo Aktarım Hatası
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

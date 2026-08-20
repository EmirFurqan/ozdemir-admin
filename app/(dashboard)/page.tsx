"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
    Package,
    Tags,
    Layers,
    Boxes,
    TrendingUp,
    AlertTriangle,
    RefreshCw,
    Search,
    ArrowUpRight,
    ArrowUpDown,
    Eye,
    Percent,
    ShieldAlert,
    BarChart3,
    PieChart,
    Coins,
    CheckCircle2,
    SlidersHorizontal,
    ImageOff,
    ExternalLink,
    ChevronRight,
    CircleDollarSign
} from "lucide-react";
import { dashboardService, DashboardStats, BrandStats, CurrencyFinancialStats } from "../services/dashboardService";
import { DonutChart, DonutSegment } from "../components/charts/DonutChart";
import { BarChart, BarItem } from "../components/charts/BarChart";

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [lastUpdated, setLastUpdated] = useState<string>("");

    // Filters
    const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | "ALL">("ALL");
    const [brandChartMetric, setBrandChartMetric] = useState<"productCount" | "inventoryValue" | "catalogPrice">("productCount");
    const [includeVat, setIncludeVat] = useState<boolean>(false);

    // Table Search & Sort
    const [brandSearch, setBrandSearch] = useState<string>("");
    const [brandSortKey, setBrandSortKey] = useState<keyof BrandStats>("productCount");
    const [brandSortAsc, setBrandSortAsc] = useState<boolean>(false);

    const loadStats = async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const data = await dashboardService.getStats();
            if (data) {
                setStats(data);
                const now = new Date();
                setLastUpdated(
                    now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                );
            }
        } catch (error) {
            console.error("Failed to load dashboard stats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    // Format currency helper
    const formatMoney = (amount: number | null | undefined, symbol = "₺") => {
        if (amount === null || amount === undefined) return `${symbol}0`;
        return `${symbol}${amount.toLocaleString("tr-TR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        })}`;
    };

    // Filtered Brand list for table
    const filteredAndSortedBrands = useMemo(() => {
        if (!stats || !stats.brandStats) return [];

        let list = [...stats.brandStats];

        if (brandSearch.trim()) {
            const q = brandSearch.toLowerCase();
            list = list.filter((b) => b.brandName.toLowerCase().includes(q));
        }

        list.sort((a, b) => {
            let aVal = a[brandSortKey] as any;
            let bVal = b[brandSortKey] as any;

            if (typeof aVal === "string") {
                aVal = aVal.toLowerCase();
                bVal = (bVal || "").toLowerCase();
                return brandSortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }

            aVal = aVal || 0;
            bVal = bVal || 0;
            return brandSortAsc ? aVal - bVal : bVal - aVal;
        });

        return list;
    }, [stats, brandSearch, brandSortKey, brandSortAsc]);

    // Active Currency Financial Summary
    const activeCurrencySummary = useMemo(() => {
        if (!stats || !stats.currencyFinancials) return null;

        if (selectedCurrencyId === "ALL") {
            // Find dominant (usually TRY 160 or first with items)
            const tryStats = stats.currencyFinancials.find((c) => c.currencyId === 160);
            return tryStats || stats.currencyFinancials[0] || null;
        }

        return stats.currencyFinancials.find((c) => c.currencyId === selectedCurrencyId) || null;
    }, [stats, selectedCurrencyId]);

    // Prepare Donut Chart Data
    const donutChartData = useMemo<DonutSegment[]>(() => {
        if (!stats || !stats.brandStats) return [];

        return stats.brandStats.slice(0, 8).map((brand) => {
            let val = brand.productCount;
            let sub = `%${brand.productPercentage.toFixed(1)}`;

            if (brandChartMetric === "inventoryValue") {
                val = includeVat ? brand.totalInventoryValueInclVat : brand.totalInventoryValueExclVat;
                sub = formatMoney(val, brand.primaryCurrencySymbol);
            } else if (brandChartMetric === "catalogPrice") {
                val = includeVat ? brand.totalCatalogPriceInclVat : brand.totalCatalogPriceExclVat;
                sub = formatMoney(val, brand.primaryCurrencySymbol);
            }

            return {
                label: brand.brandName,
                value: val || 0,
                subValue: sub,
            };
        });
    }, [stats, brandChartMetric, includeVat]);

    // Prepare Bar Chart Data
    const barChartData = useMemo<BarItem[]>(() => {
        if (!stats || !stats.brandStats) return [];

        return stats.brandStats.slice(0, 7).map((brand) => {
            const exclVal = brand.totalInventoryValueExclVat || 0;
            const inclVal = brand.totalInventoryValueInclVat || 0;
            const sym = brand.primaryCurrencySymbol || "₺";

            return {
                label: brand.brandName,
                value: exclVal,
                secondaryValue: inclVal,
                subLabel: `${brand.productCount} Ürün • ${brand.totalStockUnits} Stok`,
                formattedValue: formatMoney(exclVal, sym),
                formattedSecondaryValue: formatMoney(inclVal, sym),
            };
        });
    }, [stats]);

    const handleSort = (key: keyof BrandStats) => {
        if (brandSortKey === key) {
            setBrandSortAsc(!brandSortAsc);
        } else {
            setBrandSortKey(key);
            setBrandSortAsc(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium text-sm animate-pulse">İstatistikler ve portföy verileri yükleniyor...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto my-12">
                <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">Veriler Alınamadı</h3>
                <p className="text-sm text-slate-500 mb-4">Sunucu ile bağlantı kurulamadı veya henüz veri bulunmuyor.</p>
                <button
                    onClick={() => loadStats(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition inline-flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Yeniden Dene
                </button>
            </div>
        );
    }

    const { overview, stockHealth, currencyFinancials, categoryStats, topValueProducts, topViewedProducts } = stats;

    return (
        <div className="space-y-8 pb-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Admin Yönetim Paneli
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                            Canlı Veri
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm">
                        Ürün kataloğu, marka dağılımları, stok sağlığı ve ciro/portföy değer analizi.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                            Son güncelleme: {lastUpdated}
                        </span>
                    )}
                    <button
                        onClick={() => loadStats(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        <span>{refreshing ? "Güncelleniyor..." : "Yenile"}</span>
                    </button>
                </div>
            </div>

            {/* Currency Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/80 p-2 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    <span className="text-xs font-bold text-slate-500 px-3 uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-slate-400" /> Para Birimi:
                    </span>
                    <button
                        onClick={() => setSelectedCurrencyId("ALL")}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedCurrencyId === "ALL"
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                        }`}
                    >
                        Tümü / Genel Bakış
                    </button>
                    {currencyFinancials.map((cur) => (
                        <button
                            key={cur.currencyId}
                            onClick={() => setSelectedCurrencyId(cur.currencyId)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                selectedCurrencyId === cur.currencyId
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                            }`}
                        >
                            <span>{cur.currencySymbol}</span>
                            <span>{cur.currencyCode}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${selectedCurrencyId === cur.currencyId ? "bg-blue-700 text-blue-100" : "bg-slate-200 text-slate-600"}`}>
                                {cur.productCount}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 px-2">
                    <span className="text-xs text-slate-500 font-medium">KDV Gösterimi:</span>
                    <button
                        onClick={() => setIncludeVat(!includeVat)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            includeVat
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-slate-200 text-slate-700"
                        }`}
                    >
                        <Percent className="w-3 h-3" />
                        <span>{includeVat ? "KDV Dahil" : "KDV Hariç (Net)"}</span>
                    </button>
                </div>
            </div>

            {/* 4 Hero KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Depo Envanter / Ciro Değeri */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-sm border border-blue-500/30">
                    <div className="absolute right-3 -bottom-3 opacity-10 pointer-events-none">
                        <Boxes className="w-32 h-32 text-white" />
                    </div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
                            Depo Stok Değeri
                        </span>
                        <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-extrabold mb-1 tracking-tight">
                        {activeCurrencySummary
                            ? formatMoney(
                                  includeVat
                                      ? activeCurrencySummary.totalInventoryValueInclVat
                                      : activeCurrencySummary.totalInventoryValueExclVat,
                                  activeCurrencySummary.currencySymbol
                              )
                            : "₺0"}
                    </div>
                    <p className="text-xs text-blue-100 font-medium">
                        {includeVat ? "KDV Dahil" : "KDV Hariç (Net)"} Depo Fiziksel Değeri
                    </p>
                    <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-blue-100">
                        <span>Karşıt Değer:</span>
                        <span className="font-bold text-white">
                            {activeCurrencySummary
                                ? formatMoney(
                                      includeVat
                                          ? activeCurrencySummary.totalInventoryValueExclVat
                                          : activeCurrencySummary.totalInventoryValueInclVat,
                                      activeCurrencySummary.currencySymbol
                                  )
                                : "₺0"}{" "}
                            ({includeVat ? "KDV'siz" : "KDV'li"})
                        </span>
                    </div>
                </div>

                {/* Card 2: Toplam Katalog Liste Değeri */}
                <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Katalog Liste Değeri
                        </span>
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                            <CircleDollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">
                        {activeCurrencySummary
                            ? formatMoney(
                                  includeVat
                                      ? activeCurrencySummary.totalCatalogPriceInclVat
                                      : activeCurrencySummary.totalCatalogPriceExclVat,
                                  activeCurrencySummary.currencySymbol
                              )
                            : "₺0"}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                        1'er Adet Liste Satış Fiyatı Toplamı ({includeVat ? "KDV Dahil" : "KDV Hariç"})
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <span>Ortalama Ürün Fiyatı:</span>
                        <span className="font-bold text-slate-900">
                            {activeCurrencySummary
                                ? formatMoney(activeCurrencySummary.averagePrice, activeCurrencySummary.currencySymbol)
                                : "₺0"}
                        </span>
                    </div>
                </div>

                {/* Card 3: Toplam Ürün & Çeşitlilik */}
                <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Ürün Portföyü
                        </span>
                        <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                            <Package className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">
                        {overview.totalProducts.toLocaleString("tr-TR")}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium mt-1">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {overview.activeProducts} Aktif
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{overview.inactiveProducts} Pasif</span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <span>Marka / Kategori:</span>
                        <span className="font-bold text-slate-900">
                            {overview.totalBrands} Marka • {overview.totalCategories} Kategori
                        </span>
                    </div>
                </div>

                {/* Card 4: Toplam Fiziksel Stok Hacmi */}
                <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Toplam Stok Hacmi
                        </span>
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                            <Boxes className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">
                        {overview.totalStockUnits.toLocaleString("tr-TR")}{" "}
                        <span className="text-sm font-semibold text-slate-500">Adet</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium mt-1">
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                            {overview.lowStockCount} Kritik Stok
                        </span>
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                            {overview.outOfStockCount} Tükendi
                        </span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <span>Yeterli Stok Oranı:</span>
                        <span className="font-bold text-emerald-600">%{stockHealth.inStockPercentage}</span>
                    </div>
                </div>
            </div>

            {/* Quality Alerts Banner */}
            {(overview.unbrandedProductCount > 0 ||
                overview.noImageProductCount > 0 ||
                overview.uncategorizedProductCount > 0 ||
                overview.zeroPriceProductCount > 0) && (
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-amber-900">
                                Katalog Veri Kalitesi ve İyileştirme Fırsatları
                            </h4>
                            <p className="text-xs text-amber-700 mt-0.5">
                                Eksik bilgili ürünleri tamamlayarak müşteri deneyimini ve filtreleme kalitesini artırın:
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {overview.unbrandedProductCount > 0 && (
                                    <Link
                                        href="/erp-matcher"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-amber-900 border border-amber-200 text-xs font-semibold hover:bg-amber-100/50 transition"
                                    >
                                        <Tags className="w-3.5 h-3.5 text-amber-600" />
                                        <span>{overview.unbrandedProductCount} Markasız Ürün</span>
                                    </Link>
                                )}
                                {overview.uncategorizedProductCount > 0 && (
                                    <Link
                                        href="/products"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-amber-900 border border-amber-200 text-xs font-semibold hover:bg-amber-100/50 transition"
                                    >
                                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                                        <span>{overview.uncategorizedProductCount} Kategorisiz Ürün</span>
                                    </Link>
                                )}
                                {overview.noImageProductCount > 0 && (
                                    <Link
                                        href="/products"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-amber-900 border border-amber-200 text-xs font-semibold hover:bg-amber-100/50 transition"
                                    >
                                        <ImageOff className="w-3.5 h-3.5 text-amber-600" />
                                        <span>{overview.noImageProductCount} Görselsiz Ürün</span>
                                    </Link>
                                )}
                                {overview.zeroPriceProductCount > 0 && (
                                    <Link
                                        href="/products"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-amber-900 border border-amber-200 text-xs font-semibold hover:bg-amber-100/50 transition"
                                    >
                                        <CircleDollarSign className="w-3.5 h-3.5 text-amber-600" />
                                        <span>{overview.zeroPriceProductCount} Fiyatsız Ürün</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Visual Analytics 2-Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sol Grafik: Marka Dağılımı Donut Chart (5 Cols) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-slate-900 text-base">Marka Dağılımı</h3>
                            </div>
                        </div>

                        {/* Metric Toggle Tabs */}
                        <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-6 text-xs font-semibold">
                            <button
                                onClick={() => setBrandChartMetric("productCount")}
                                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                                    brandChartMetric === "productCount"
                                        ? "bg-white text-slate-900 shadow-xs"
                                        : "text-slate-500 hover:text-slate-900"
                                }`}
                            >
                                Ürün Sayısı
                            </button>
                            <button
                                onClick={() => setBrandChartMetric("inventoryValue")}
                                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                                    brandChartMetric === "inventoryValue"
                                        ? "bg-white text-slate-900 shadow-xs"
                                        : "text-slate-500 hover:text-slate-900"
                                }`}
                            >
                                Depo Değeri
                            </button>
                            <button
                                onClick={() => setBrandChartMetric("catalogPrice")}
                                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                                    brandChartMetric === "catalogPrice"
                                        ? "bg-white text-slate-900 shadow-xs"
                                        : "text-slate-500 hover:text-slate-900"
                                }`}
                            >
                                Katalog Değeri
                            </button>
                        </div>

                        <DonutChart
                            data={donutChartData}
                            totalLabel={
                                brandChartMetric === "productCount"
                                    ? "Toplam Ürün"
                                    : brandChartMetric === "inventoryValue"
                                    ? "Depo Toplamı"
                                    : "Katalog Toplamı"
                            }
                            centerSubtext={
                                brandChartMetric === "productCount"
                                    ? "Çeşit"
                                    : includeVat
                                    ? "KDV Dahil"
                                    : "KDV Hariç"
                            }
                            formatValue={(v) =>
                                brandChartMetric === "productCount"
                                    ? v.toLocaleString("tr-TR")
                                    : formatMoney(v, activeCurrencySummary?.currencySymbol || "₺")
                            }
                        />
                    </div>
                </div>

                {/* Sağ Grafik: Markalara Göre Stok/Ciro Değeri Sıralaması (7 Cols) */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-bold text-slate-900 text-base">
                                    En Değerli Marka Envanterleri
                                </h3>
                            </div>
                            <span className="text-xs text-slate-400 font-medium">İlk 7 Marka</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-6">
                            Markaların depodaki mevcut stok adetleri ile birim fiyatlarının çarpımından elde edilen toplam envanter değeri.
                        </p>

                        <BarChart
                            data={barChartData}
                            valueLabel="KDV Hariç Tutar"
                            secondaryValueLabel="KDV Dahil Tutar"
                            color="from-blue-600 via-indigo-600 to-purple-600"
                            maxItems={7}
                        />
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Tüm marka portföyünü detay tablosundan inceleyebilirsiniz.</span>
                        <Link
                            href="/brands"
                            className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            Marka Yönetimi <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Currency Detail Breakdown Cards */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-blue-600" /> Para Birimi Kırılımları ve Finansal Özet
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {currencyFinancials.map((cur) => (
                        <div
                            key={cur.currencyId}
                            className={`p-5 rounded-2xl border transition-all ${
                                selectedCurrencyId === cur.currencyId
                                    ? "bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20"
                                    : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                                        {cur.currencySymbol}
                                    </span>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{cur.currencyCode}</h4>
                                        <p className="text-[11px] text-slate-500">
                                            {cur.productCount} Ürün • {cur.totalStockUnits} Stok
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                                    Ort. {formatMoney(cur.averagePrice, cur.currencySymbol)}
                                </span>
                            </div>

                            <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Depo Stok (KDV'siz):</span>
                                    <span className="font-bold text-slate-900">
                                        {formatMoney(cur.totalInventoryValueExclVat, cur.currencySymbol)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Depo Stok (KDV Dahil):</span>
                                    <span className="font-bold text-emerald-700">
                                        {formatMoney(cur.totalInventoryValueInclVat, cur.currencySymbol)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Katalog Fiyat (KDV'siz):</span>
                                    <span className="font-bold text-slate-700">
                                        {formatMoney(cur.totalCatalogPriceExclVat, cur.currencySymbol)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Katalog Fiyat (KDV Dahil):</span>
                                    <span className="font-bold text-slate-700">
                                        {formatMoney(cur.totalCatalogPriceInclVat, cur.currencySymbol)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stock Health & Category Distribution (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sol: Stok Durumu ve Sağlık Göstergesi (5 Cols) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Boxes className="w-5 h-5 text-amber-600" />
                            <h3 className="font-bold text-slate-900 text-base">Stok Sağlık Analizi</h3>
                        </div>
                    </div>

                    {/* Progress Segment Bar */}
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex mb-4">
                        <div
                            style={{ width: `${stockHealth.inStockPercentage}%` }}
                            className="bg-emerald-500 h-full transition-all duration-500"
                            title={`Yeterli Stok: %${stockHealth.inStockPercentage}`}
                        />
                        <div
                            style={{ width: `${stockHealth.lowStockPercentage}%` }}
                            className="bg-amber-400 h-full transition-all duration-500"
                            title={`Kritik Stok: %${stockHealth.lowStockPercentage}`}
                        />
                        <div
                            style={{ width: `${stockHealth.outOfStockPercentage}%` }}
                            className="bg-rose-500 h-full transition-all duration-500"
                            title={`Tükendi: %${stockHealth.outOfStockPercentage}`}
                        />
                    </div>

                    {/* Legend Details */}
                    <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="font-bold text-emerald-900">Yeterli Stok (≥ 20 Adet)</span>
                            </div>
                            <span className="font-extrabold text-emerald-900">
                                {stockHealth.inStock} Ürün (%{stockHealth.inStockPercentage})
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-amber-400" />
                                <span className="font-bold text-amber-900">Kritik Stok (1 - 19 Adet)</span>
                            </div>
                            <span className="font-extrabold text-amber-900">
                                {stockHealth.lowStock} Ürün (%{stockHealth.lowStockPercentage})
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-rose-500" />
                                <span className="font-bold text-rose-900">Stokta Yok (0 Adet)</span>
                            </div>
                            <span className="font-extrabold text-rose-900">
                                {stockHealth.outOfStock} Ürün (%{stockHealth.outOfStockPercentage})
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sağ: Kategori Dağılımı (7 Cols) */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-teal-600" />
                            <h3 className="font-bold text-slate-900 text-base">Kategorilere Göre Dağılım</h3>
                        </div>
                        <Link href="/categories" className="text-xs font-semibold text-blue-600 hover:underline">
                            Tüm Kategoriler
                        </Link>
                    </div>

                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {categoryStats.slice(0, 6).map((cat, idx) => (
                            <div
                                key={cat.categoryId ?? idx}
                                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 transition"
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">
                                            {idx + 1}
                                        </span>
                                        <span className="font-semibold text-slate-800 text-xs">
                                            {cat.categoryName}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-slate-900 text-xs">
                                            {cat.productCount} Ürün
                                        </span>
                                        <span className="text-slate-400 text-[11px] ml-1.5">
                                            ({cat.totalStockUnits} Stok)
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                                        style={{ width: `${Math.min(100, Math.max(5, cat.productPercentage))}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Brand Portfolio Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Tags className="w-5 h-5 text-blue-600" /> Detaylı Marka Portföy & Değer Tablosu
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Her markanın ürün sayısı, fiziksel stok adedi ve KDV'siz/KDV'li toplam portföy değerleri.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Marka ara..."
                                value={brandSearch}
                                onChange={(e) => setBrandSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-52 transition"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <th
                                    onClick={() => handleSort("brandName")}
                                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>Marka Adı</span>
                                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("productCount")}
                                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none text-center"
                                >
                                    <div className="flex items-center justify-center gap-1.5">
                                        <span>Ürün Sayısı</span>
                                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("productPercentage")}
                                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none text-center"
                                >
                                    <div className="flex items-center justify-center gap-1.5">
                                        <span>Portföy Payı</span>
                                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("totalStockUnits")}
                                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none text-center"
                                >
                                    <div className="flex items-center justify-center gap-1.5">
                                        <span>Toplam Stok</span>
                                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("totalInventoryValueExclVat")}
                                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none text-right"
                                >
                                    <div className="flex items-center justify-end gap-1.5">
                                        <span>Depo Değeri (KDV'siz)</span>
                                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("totalInventoryValueInclVat")}
                                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none text-right"
                                >
                                    <div className="flex items-center justify-end gap-1.5">
                                        <span>Depo Değeri (KDV Dahil)</span>
                                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("totalCatalogPriceExclVat")}
                                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none text-right"
                                >
                                    <div className="flex items-center justify-end gap-1.5">
                                        <span>Liste Toplamı (KDV'siz)</span>
                                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-center">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAndSortedBrands.map((brand, i) => {
                                const sym = brand.primaryCurrencySymbol || "₺";
                                return (
                                    <tr key={brand.brandId ?? `unbranded-${i}`} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {brand.brandName.substring(0, 2).toUpperCase()}
                                                </span>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-sm">
                                                        {brand.brandName}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {brand.activeProductCount} Aktif • {brand.outOfStockCount} Tükendi
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                                            {brand.productCount.toLocaleString("tr-TR")}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px]">
                                                %{brand.productPercentage.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                                            {brand.totalStockUnits.toLocaleString("tr-TR")} Adet
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                                            {formatMoney(brand.totalInventoryValueExclVat, sym)}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                                            {formatMoney(brand.totalInventoryValueInclVat, sym)}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-semibold text-slate-600">
                                            {formatMoney(brand.totalCatalogPriceExclVat, sym)}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            {brand.brandId ? (
                                                <Link
                                                    href={`/products?brandId=${brand.brandId}`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                                                >
                                                    Ürünler <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            ) : (
                                                <span className="text-slate-400 text-[11px]">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Products Showcase (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* En Yüksek Stok Değerine Sahip Ürünler */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-bold text-slate-900 text-base">
                                En Yüksek Depo Değerine Sahip Ürünler
                            </h3>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">Stok × Fiyat</span>
                    </div>

                    <div className="space-y-3">
                        {topValueProducts.slice(0, 5).map((prod) => (
                            <div
                                key={prod.id}
                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 transition"
                            >
                                <div className="min-w-0 pr-3">
                                    <p className="font-bold text-slate-900 text-xs truncate" title={prod.name}>
                                        {prod.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                        <span className="font-mono bg-slate-200/60 px-1.5 py-0.2 rounded text-slate-700">
                                            {prod.code}
                                        </span>
                                        <span>•</span>
                                        <span>{prod.brandName}</span>
                                        <span>•</span>
                                        <span>{prod.stock} Adet</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-xs font-extrabold text-slate-900">
                                        {formatMoney(prod.totalInventoryValueExclVat, prod.currencySymbol)}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        Birim: {formatMoney(prod.price, prod.currencySymbol)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* En Çok Görüntülenen Ürünler */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-slate-900 text-base">
                                En Çok İncelenen / Popüler Ürünler
                            </h3>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">Görüntülenme</span>
                    </div>

                    <div className="space-y-3">
                        {topViewedProducts.slice(0, 5).map((prod) => (
                            <div
                                key={prod.id}
                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 transition"
                            >
                                <div className="min-w-0 pr-3">
                                    <p className="font-bold text-slate-900 text-xs truncate" title={prod.name}>
                                        {prod.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                        <span className="font-mono bg-slate-200/60 px-1.5 py-0.2 rounded text-slate-700">
                                            {prod.code}
                                        </span>
                                        <span>•</span>
                                        <span>{prod.brandName}</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-xs font-bold text-blue-600 flex items-center justify-end gap-1">
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>{prod.viewCount.toLocaleString("tr-TR")} Görüntülenme</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        Fiyat: {formatMoney(prod.price, prod.currencySymbol)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
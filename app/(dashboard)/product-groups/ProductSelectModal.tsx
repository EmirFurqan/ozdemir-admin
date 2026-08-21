"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    Search,
    Check,
    X,
    CheckSquare,
    Square,
    Layers,
    Filter,
    Sparkles,
    SlidersHorizontal,
    Package,
    RefreshCw,
    AlertCircle,
    ArrowUpDown,
    CheckCircle2,
    Tag,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TableImage from "@/app/components/TableImage";

interface ProductSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    allProducts: any[];
    selectedIds: number[];
    brands?: any[];
    categories?: any[];
    currentGroupId?: number;
    currentGroupCode?: string;
    onApply: (selectedIds: number[], selectedProductObjects: any[]) => void;
    isLoading?: boolean;
}

export default function ProductSelectModal({
    isOpen,
    onClose,
    allProducts = [],
    selectedIds = [],
    brands = [],
    categories = [],
    currentGroupId = 0,
    currentGroupCode = "",
    onApply,
    isLoading = false,
}: ProductSelectModalProps) {
    // Local selection state (Set of product IDs)
    const [selectedSet, setSelectedSet] = useState<Set<number>>(new Set(selectedIds));
    const [searchQuery, setSearchQuery] = useState("");
    const [brandFilter, setBrandFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [viewTab, setViewTab] = useState<"all" | "selected" | "unselected">("all");
    const [pinSelectedAtTop, setPinSelectedAtTop] = useState(true);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Sync local selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedSet(new Set(selectedIds));
            setSearchQuery("");
            setBrandFilter("all");
            setCategoryFilter("all");
            setViewTab("all");
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, selectedIds]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Fast map of products by ID
    const productMap = useMemo(() => {
        const map = new Map<number, any>();
        allProducts.forEach((p) => {
            map.set(p.id, p);
        });
        return map;
    }, [allProducts]);

    // Toggle single product selection
    const toggleProduct = (id: number) => {
        setSelectedSet((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Filter matcher helper
    const matchesFilter = (p: any, query: string, bFilter: string, cFilter: string) => {
        if (bFilter !== "all") {
            const bId = p.brand?.id || p.brandId;
            if (!bId || bId.toString() !== bFilter) return false;
        }
        if (cFilter !== "all") {
            const cId = p.category?.id || p.categoryId;
            if (!cId || cId.toString() !== cFilter) return false;
        }
        if (!query) return true;

        const q = query.toLowerCase().trim();
        const code = (p.code || "").toLowerCase();
        const name = (p.name || "").toLowerCase();
        const vLabel = (p.variantLabel || "").toLowerCase();
        const bName = (p.brand?.name || "").toLowerCase();
        const cName = (p.category?.name || "").toLowerCase();
        const gCode = (p.groupCode || "").toLowerCase();
        const idStr = p.id.toString();

        return (
            code.includes(q) ||
            name.includes(q) ||
            vLabel.includes(q) ||
            bName.includes(q) ||
            cName.includes(q) ||
            gCode.includes(q) ||
            idStr.includes(q)
        );
    };

    // Selected products list (filtered or full based on user preference)
    const selectedProductsList = useMemo(() => {
        const list: any[] = [];
        selectedSet.forEach((id) => {
            const prod = productMap.get(id);
            if (prod) {
                list.push(prod);
            }
        });
        return list;
    }, [selectedSet, productMap]);

    // Compute partitioned & sorted product rows
    const { displayedSelected, displayedUnselected } = useMemo(() => {
        const selected: any[] = [];
        const unselected: any[] = [];

        // All selected products are preserved at the top
        selectedProductsList.forEach((p) => {
            selected.push(p);
        });

        // Unselected products filtered by search, brand, and category
        allProducts.forEach((p) => {
            if (!selectedSet.has(p.id)) {
                if (matchesFilter(p, searchQuery, brandFilter, categoryFilter)) {
                    unselected.push(p);
                }
            }
        });

        return {
            displayedSelected: selected,
            displayedUnselected: unselected,
        };
    }, [allProducts, selectedProductsList, selectedSet, searchQuery, brandFilter, categoryFilter]);

    // Total displayed list based on viewTab
    const finalDisplayList = useMemo(() => {
        if (viewTab === "selected") {
            return displayedSelected;
        }
        if (viewTab === "unselected") {
            return displayedUnselected;
        }
        // "all" mode: Selected ALWAYS first, then unselected
        if (pinSelectedAtTop) {
            return [...displayedSelected, ...displayedUnselected];
        }
        // If pin off: standard search across all
        return allProducts.filter((p) => matchesFilter(p, searchQuery, brandFilter, categoryFilter));
    }, [viewTab, pinSelectedAtTop, displayedSelected, displayedUnselected, allProducts, searchQuery, brandFilter, categoryFilter]);

    // Select all currently filtered unselected items
    const handleSelectAllFiltered = () => {
        setSelectedSet((prev) => {
            const next = new Set(prev);
            displayedUnselected.forEach((p) => next.add(p.id));
            return next;
        });
    };

    // Deselect all items
    const handleClearAllSelections = () => {
        setSelectedSet(new Set());
    };

    // Handle Confirm / Apply
    const handleApply = () => {
        const idsArray = Array.from(selectedSet);
        const selectedObjs = idsArray
            .map((id) => productMap.get(id))
            .filter(Boolean);
        onApply(idsArray, selectedObjs);
        onClose();
    };

    if (!isOpen) return null;

    const selectedCount = selectedSet.size;
    const totalAvailableCount = allProducts.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Dialog Card */}
            <div className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-xs">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-900">
                                    Gruba Ürün Seçimi
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                    {selectedCount} Seçili
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Ürünleri arayın ve işaretleyin. Seçili ürünler her zaman listenin en üstünde sabitlenir.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title="Kapat (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filter and Search Bar Section */}
                <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200/80 space-y-3 shrink-0">
                    {/* Top Row: Search Input + Brand + Category + View Tabs */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* Search Input */}
                        <div className="sm:col-span-5 relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <Input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Ürün kodu, adı, etiket veya ID ile ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-8 bg-white border-slate-200 text-xs h-10 rounded-xl focus:ring-2 focus:ring-red-500/20"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Brand Filter */}
                        {brands && brands.length > 0 && (
                            <div className="sm:col-span-3">
                                <select
                                    value={brandFilter}
                                    onChange={(e) => setBrandFilter(e.target.value)}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                                >
                                    <option value="all">Tüm Markalar</option>
                                    {brands.map((b: any) => (
                                        <option key={b.id} value={b.id.toString()}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Category Filter */}
                        {categories && categories.length > 0 && (
                            <div className="sm:col-span-4">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                                >
                                    <option value="all">Tüm Kategoriler</option>
                                    {categories.map((c: any) => (
                                        <option key={c.id} value={c.id.toString()}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Bottom Row: Quick Status Tabs & Action Helpers */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        {/* View Tabs */}
                        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold text-slate-600">
                            <button
                                type="button"
                                onClick={() => setViewTab("all")}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    viewTab === "all"
                                        ? "bg-white text-slate-900 shadow-xs"
                                        : "hover:text-slate-900"
                                }`}
                            >
                                Tümü ({totalAvailableCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewTab("selected")}
                                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                    viewTab === "selected"
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "hover:text-emerald-700 text-emerald-700"
                                }`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Seçilenler ({selectedCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewTab("unselected")}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    viewTab === "unselected"
                                        ? "bg-white text-slate-900 shadow-xs"
                                        : "hover:text-slate-900"
                                }`}
                            >
                                Seçilmeyenler ({Math.max(0, totalAvailableCount - selectedCount)})
                            </button>
                        </div>

                        {/* Quick Selection Buttons */}
                        <div className="flex items-center gap-2">
                            {displayedUnselected.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleSelectAllFiltered}
                                    className="text-xs font-semibold text-slate-700 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <CheckSquare className="w-3.5 h-3.5 text-red-600" />
                                    {searchQuery || brandFilter !== "all" || categoryFilter !== "all"
                                        ? `Filtrelenenleri Seç (${displayedUnselected.length})`
                                        : "Tümünü Seç"}
                                </button>
                            )}

                            {selectedCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearAllSelections}
                                    className="text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Seçimleri Temizle
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Content Area */}
                <div className="flex-1 overflow-y-auto min-h-[300px] relative divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                            <RefreshCw className="w-8 h-8 animate-spin text-red-600" />
                            <p className="text-xs font-medium">Ürün listesi yükleniyor...</p>
                        </div>
                    ) : finalDisplayList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-slate-500 space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">
                                    {viewTab === "selected"
                                        ? "Henüz hiç ürün seçilmedi."
                                        : "Aramanıza veya filtrenize uygun ürün bulunamadı."}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {viewTab === "selected"
                                        ? "Tablodan ürünlerin yanındaki kutucukları işaretleyerek ekleyebilirsiniz."
                                        : "Farklı bir arama terimi veya filtre deneyebilirsiniz."}
                                </p>
                            </div>
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setBrandFilter("all");
                                        setCategoryFilter("all");
                                        setViewTab("all");
                                    }}
                                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                                >
                                    Filtreleri Temizle
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-slate-100/90 backdrop-blur-xs text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider sticky top-0 z-20 shadow-2xs">
                                <tr>
                                    <th className="p-3.5 w-12 text-center">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={displayedUnselected.length === 0 && selectedCount > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        handleSelectAllFiltered();
                                                    } else {
                                                        handleClearAllSelections();
                                                    }
                                                }}
                                                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer accent-red-600"
                                                title="Tümünü Seç / Kaldır"
                                            />
                                        </div>
                                    </th>
                                    <th className="p-3.5 w-16">Resim</th>
                                    <th className="p-3.5 w-36">Ürün Kodu</th>
                                    <th className="p-3.5">Ürün İsmi & Bilgisi</th>
                                    <th className="p-3.5 w-32">Marka / Kategori</th>
                                    <th className="p-3.5 w-24">Fiyat</th>
                                    <th className="p-3.5 w-20">Stok</th>
                                    <th className="p-3.5 w-32">Mevcut Grup</th>
                                    <th className="p-3.5 w-20 text-center">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {viewTab === "all" && displayedSelected.length > 0 && (
                                    <tr className="bg-emerald-500/10 border-y border-emerald-500/20">
                                        <td colSpan={9} className="px-4 py-2 font-bold text-emerald-800 text-[11px]">
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    SEÇİLEN ÜRÜNLER ({displayedSelected.length} Adet — Her Zaman En Üstte)
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={handleClearAllSelections}
                                                    className="text-emerald-700 hover:text-red-600 font-semibold text-[11px] hover:underline cursor-pointer"
                                                >
                                                    Seçimleri Kaldır
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {displayedSelected.map((product) => {
                                    const isSelected = true;
                                    const img = product.images?.[0]?.url || product.imageUrl;
                                    const isInThisGroup = currentGroupId > 0 && product.groupCode === currentGroupCode;
                                    const hasOtherGroup = product.groupCode && product.groupCode !== currentGroupCode;

                                    return (
                                        <tr
                                            key={`selected-${product.id}`}
                                            onClick={() => toggleProduct(product.id)}
                                            className="bg-emerald-50/40 hover:bg-emerald-100/50 transition-colors cursor-pointer border-l-4 border-l-emerald-500"
                                        >
                                            <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleProduct(product.id)}
                                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-400 cursor-pointer accent-emerald-600"
                                                />
                                            </td>
                                            <td className="p-3.5">
                                                <TableImage
                                                    src={img}
                                                    alt={product.name || product.code}
                                                />
                                            </td>
                                            <td className="p-3.5">
                                                <div className="font-mono text-slate-900 font-bold text-xs flex items-center gap-1">
                                                    {product.code || "—"}
                                                </div>
                                                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                                    ✓ Seçili
                                                </span>
                                            </td>
                                            <td className="p-3.5">
                                                <div className="font-semibold text-slate-900 line-clamp-1">
                                                    {product.name}
                                                </div>
                                                {product.variantLabel && (
                                                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Tag className="w-3 h-3 text-slate-400" />
                                                        <span>Varyant: <b className="text-slate-700">{product.variantLabel}</b></span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3.5">
                                                <div className="space-y-1">
                                                    {product.brand?.name && (
                                                        <span className="inline-block text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                                            {product.brand.name}
                                                        </span>
                                                    )}
                                                    {product.category?.name && (
                                                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                                                            {product.category.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3.5 font-mono text-slate-900 font-semibold">
                                                {typeof product.price === "number"
                                                    ? `${product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`
                                                    : "0,00 ₺"}
                                            </td>
                                            <td className="p-3.5">
                                                <span
                                                    className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                                                        product.stock > 0
                                                            ? "bg-slate-100 text-slate-800"
                                                            : "bg-red-50 text-red-600"
                                                    }`}
                                                >
                                                    {product.stock ?? 0}
                                                </span>
                                            </td>
                                            <td className="p-3.5">
                                                {isInThisGroup ? (
                                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                                                        Bu Grupta
                                                    </span>
                                                ) : hasOtherGroup ? (
                                                    <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md truncate max-w-[110px] block" title={`Grup: ${product.groupCode}`}>
                                                        {product.groupCode}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400">
                                                        Bağımsız
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        product.active !== false
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                            : "bg-slate-100 text-slate-400 border border-slate-200"
                                                    }`}
                                                >
                                                    {product.active !== false ? "Aktif" : "Pasif"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {viewTab === "all" && displayedSelected.length > 0 && displayedUnselected.length > 0 && (
                                    <tr className="bg-slate-100/80 border-y border-slate-200">
                                        <td colSpan={9} className="px-4 py-2 font-bold text-slate-600 text-[11px]">
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1.5">
                                                    <Search className="w-3.5 h-3.5 text-slate-500" />
                                                    {searchQuery ? `ARAMA SONUÇLARI & DİĞER ÜRÜNLER (${displayedUnselected.length} Adet)` : `DİĞER ÜRÜNLER (${displayedUnselected.length} Adet)`}
                                                </span>
                                                {displayedUnselected.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={handleSelectAllFiltered}
                                                        className="text-red-600 hover:text-red-700 font-semibold text-[11px] hover:underline cursor-pointer"
                                                    >
                                                        Filtrelenenleri Gruba Ekle
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {displayedUnselected.map((product) => {
                                    const isSelected = false;
                                    const img = product.images?.[0]?.url || product.imageUrl;
                                    const isInThisGroup = currentGroupId > 0 && product.groupCode === currentGroupCode;
                                    const hasOtherGroup = product.groupCode && product.groupCode !== currentGroupCode;

                                    return (
                                        <tr
                                            key={`unselected-${product.id}`}
                                            onClick={() => toggleProduct(product.id)}
                                            className="hover:bg-slate-50/90 transition-colors cursor-pointer border-l-4 border-l-transparent"
                                        >
                                            <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleProduct(product.id)}
                                                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer accent-red-600"
                                                />
                                            </td>
                                            <td className="p-3.5">
                                                <TableImage
                                                    src={img}
                                                    alt={product.name || product.code}
                                                />
                                            </td>
                                            <td className="p-3.5 font-mono text-slate-700 font-bold text-xs">
                                                {product.code || "—"}
                                            </td>
                                            <td className="p-3.5">
                                                <div className="font-medium text-slate-800 line-clamp-1">
                                                    {product.name}
                                                </div>
                                                {product.variantLabel && (
                                                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Tag className="w-3 h-3 text-slate-400" />
                                                        <span>Varyant: <b className="text-slate-700">{product.variantLabel}</b></span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3.5">
                                                <div className="space-y-1">
                                                    {product.brand?.name && (
                                                        <span className="inline-block text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                                            {product.brand.name}
                                                        </span>
                                                    )}
                                                    {product.category?.name && (
                                                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                                                            {product.category.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3.5 font-mono text-slate-900">
                                                {typeof product.price === "number"
                                                    ? `${product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`
                                                    : "0,00 ₺"}
                                            </td>
                                            <td className="p-3.5">
                                                <span
                                                    className={`px-2 py-0.5 rounded-md font-mono text-[11px] ${
                                                        product.stock > 0
                                                            ? "bg-slate-100 text-slate-700"
                                                            : "bg-red-50 text-red-600"
                                                    }`}
                                                >
                                                    {product.stock ?? 0}
                                                </span>
                                            </td>
                                            <td className="p-3.5">
                                                {isInThisGroup ? (
                                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                                                        Bu Grupta
                                                    </span>
                                                ) : hasOtherGroup ? (
                                                    <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md truncate max-w-[110px] block" title={`Grup: ${product.groupCode}`}>
                                                        {product.groupCode}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400">
                                                        Bağımsız
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        product.active !== false
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                            : "bg-slate-100 text-slate-400 border border-slate-200"
                                                    }`}
                                                >
                                                    {product.active !== false ? "Aktif" : "Pasif"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="font-semibold text-slate-700">
                                Toplam <b className="text-emerald-700 font-bold">{selectedCount}</b> ürün seçili
                            </span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500">
                            {totalAvailableCount} toplam ürün arasından
                        </span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 sm:flex-initial text-xs h-10 px-5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                            Vazgeç
                        </Button>
                        <Button
                            type="button"
                            onClick={handleApply}
                            className="flex-1 sm:flex-initial text-xs h-10 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer shadow-md shadow-red-600/20 flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Seçimleri Uygula ({selectedCount} Ürün)
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

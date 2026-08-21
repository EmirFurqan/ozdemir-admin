"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
    Search,
    Check,
    X,
    CheckSquare,
    Layers,
    Package,
    RefreshCw,
    CheckCircle2,
    Tag,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TableImage from "@/app/components/TableImage";
import { searchProductsForModal } from "@/app/actions/product";

interface ProductSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialSelectedProducts: any[];
    brands?: any[];
    categories?: any[];
    currentGroupId?: number;
    currentGroupCode?: string;
    onApply: (selectedIds: number[], selectedProductObjects: any[]) => void;
}

export default function ProductSelectModal({
    isOpen,
    onClose,
    initialSelectedProducts = [],
    brands = [],
    categories = [],
    currentGroupId = 0,
    currentGroupCode = "",
    onApply,
}: ProductSelectModalProps) {
    // Map of currently selected products: productId -> product object
    const [selectedMap, setSelectedMap] = useState<Map<number, any>>(new Map());

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [brandFilter, setBrandFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    // Server-side pagination state for browsed/searched products
    const [page, setPage] = useState(0);
    const [pageSize] = useState(40);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Initialize selected items map when modal opens
    useEffect(() => {
        if (isOpen) {
            const map = new Map<number, any>();
            initialSelectedProducts.forEach((p) => {
                const id = p.productId || p.id;
                if (id) {
                    map.set(id, {
                        ...p,
                        id: id,
                        productId: id,
                    });
                }
            });
            setSelectedMap(map);
            setSearchQuery("");
            setDebouncedSearch("");
            setBrandFilter("all");
            setCategoryFilter("all");
            setPage(0);

            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, initialSelectedProducts]);

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

    // Debounce search query input (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(0);
        }, 280);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch products from server whenever debouncedSearch, brandFilter, categoryFilter, or page changes
    const fetchServerProducts = useCallback(async () => {
        if (!isOpen) return;
        setLoading(true);
        try {
            const res = await searchProductsForModal({
                page,
                size: pageSize,
                search: debouncedSearch,
                brandId: brandFilter,
                categoryId: categoryFilter,
            });

            setSearchResults(res.content || []);
            setTotalPages(res.totalPages || 1);
            setTotalElements(res.totalElements || 0);
        } catch (error) {
            console.error("Error fetching products in modal:", error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    }, [isOpen, page, pageSize, debouncedSearch, brandFilter, categoryFilter]);

    useEffect(() => {
        fetchServerProducts();
    }, [fetchServerProducts]);

    // Toggle product selection
    const toggleProduct = (product: any) => {
        const id = product.productId || product.id;
        if (!id) return;

        setSelectedMap((prev) => {
            const next = new Map(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.set(id, {
                    ...product,
                    id: id,
                    productId: id,
                });
            }
            return next;
        });
    };

    // Unselect product
    const unselectProduct = (id: number) => {
        setSelectedMap((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    };

    // Clear all selections
    const handleClearAll = () => {
        setSelectedMap(new Map());
    };

    // Select all currently visible unselected search results
    const handleSelectAllVisible = () => {
        setSelectedMap((prev) => {
            const next = new Map(prev);
            searchResults.forEach((p) => {
                const id = p.productId || p.id;
                if (id) {
                    next.set(id, {
                        ...p,
                        id: id,
                        productId: id,
                    });
                }
            });
            return next;
        });
    };

    // Handle Confirm / Apply
    const handleApply = () => {
        const idsArray = Array.from(selectedMap.keys());
        const selectedObjects = Array.from(selectedMap.values());
        onApply(idsArray, selectedObjects);
        onClose();
    };

    // Helper to get currency info
    const getCurrencyInfo = (p: any) => {
        const cur = p.currency;
        const curId = p.currencyId;
        if (curId === 1 || cur === "$" || cur === "USD" || cur === 1) {
            return { symbol: "$", code: "USD", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        }
        if (curId === 20 || cur === "€" || cur === "EUR" || cur === "20") {
            return { symbol: "€", code: "EUR", bg: "bg-blue-50 text-blue-700 border-blue-200" };
        }
        return { symbol: "₺", code: "TL", bg: "bg-slate-100 text-slate-700 border-slate-200" };
    };

    const formatPrice = (product: any) => {
        const priceVal = typeof product.price === "number" ? product.price : parseFloat(product.price) || 0;
        const curInfo = getCurrencyInfo(product);
        return (
            <div className="font-mono text-slate-900 font-semibold flex items-center gap-1.5">
                <span>{priceVal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${curInfo.bg}`}>
                    {curInfo.symbol} {curInfo.code}
                </span>
            </div>
        );
    };

    // Filter categories dynamically by selected brand
    const filteredCategoriesForModal = useMemo(() => {
        if (!brandFilter || brandFilter === "all") return [];
        return categories.filter((c: any) => {
            const bId = c.brandId || c.brand?.id;
            return bId && bId.toString() === brandFilter.toString();
        });
    }, [categories, brandFilter]);

    // Selected products array (always rendered at top)
    const selectedList = useMemo(() => Array.from(selectedMap.values()), [selectedMap]);

    // Unselected search results (rendered below pinned selected products)
    const unselectedSearchResults = useMemo(() => {
        return searchResults.filter((p) => !selectedMap.has(p.id || p.productId));
    }, [searchResults, selectedMap]);

    if (!isOpen) return null;

    const selectedCount = selectedMap.size;

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
                <div className="px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-xs">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-900">
                                    Gruba Ürün Seçimi
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {selectedCount} Ürün Seçili
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Ürünleri arayın ve seçin. Seçtiğiniz ürünler her zaman en üstte sabit olarak listelenir.
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

                {/* Filter & Search Bar Section (Fast & Minimal) */}
                <div className="p-4 bg-slate-50 border-b border-slate-200/80 space-y-3 shrink-0">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* Search Input - Expands if category is not shown */}
                        <div className={brandFilter !== "all" ? "sm:col-span-5 relative" : "sm:col-span-8 relative"}>
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <Input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Ürün kodu, ürün adı veya varyant ile arayın..."
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
                            <div className={brandFilter !== "all" ? "sm:col-span-3" : "sm:col-span-4"}>
                                <select
                                    value={brandFilter}
                                    onChange={(e) => {
                                        setBrandFilter(e.target.value);
                                        setCategoryFilter("all");
                                        setPage(0);
                                    }}
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

                        {/* Category Filter - ONLY OPENS WHEN A SPECIFIC BRAND IS SELECTED */}
                        {brandFilter !== "all" && (
                            <div className="sm:col-span-4 animate-in fade-in slide-in-from-left-2 duration-200">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => {
                                        setCategoryFilter(e.target.value);
                                        setPage(0);
                                    }}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                                >
                                    <option value="all">Tüm Kategoriler ({filteredCategoriesForModal.length})</option>
                                    {filteredCategoriesForModal.map((c: any) => (
                                        <option key={c.id} value={c.id.toString()}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table Content Area */}
                <div className="flex-1 overflow-y-auto min-h-[320px] relative divide-y divide-slate-100">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-100/95 backdrop-blur-xs text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider sticky top-0 z-20 shadow-2xs">
                            <tr>
                                <th className="p-3.5 w-12 text-center">Seçim</th>
                                <th className="p-3.5 w-16">Resim</th>
                                <th className="p-3.5 w-36">Ürün Kodu</th>
                                <th className="p-3.5">Ürün İsmi & Varyant</th>
                                <th className="p-3.5 w-32">Marka / Kategori</th>
                                <th className="p-3.5 w-24">Fiyat</th>
                                <th className="p-3.5 w-20">Stok</th>
                                <th className="p-3.5 w-28">Grup</th>
                                <th className="p-3.5 w-20 text-center">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {/* SECTION 1: PINNED SELECTED PRODUCTS (ALWAYS AT THE TOP) */}
                            {selectedList.length > 0 && (
                                <tr className="bg-emerald-500/10 border-y border-emerald-500/25 sticky top-[41px] z-10">
                                    <td colSpan={9} className="px-4 py-2 font-bold text-emerald-800 text-[11px]">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                SEÇİLEN ÜRÜNLER ({selectedList.length} Adet — En Üstte Sabitlendi)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleClearAll}
                                                className="text-emerald-700 hover:text-red-600 font-semibold text-[11px] hover:underline cursor-pointer flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Tüm Seçimleri Kaldır
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {selectedList.map((product) => {
                                const id = product.productId || product.id;
                                const img = product.images?.[0]?.url || product.imageUrl;
                                const isInThisGroup = currentGroupId > 0 && product.groupCode === currentGroupCode;
                                const hasOtherGroup = product.groupCode && product.groupCode !== currentGroupCode;

                                return (
                                    <tr
                                        key={`selected-${id}`}
                                        onClick={() => unselectProduct(id)}
                                        className="bg-emerald-50/50 hover:bg-emerald-100/60 transition-colors cursor-pointer border-l-4 border-l-emerald-500"
                                    >
                                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={true}
                                                onChange={() => unselectProduct(id)}
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
                                            <div className="font-mono text-slate-900 font-bold text-xs">
                                                {product.code || "—"}
                                            </div>
                                            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/90 px-1.5 py-0.5 rounded">
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
                                        <td className="p-3.5">
                                            {formatPrice(product)}
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
                                                <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md truncate max-w-[100px] block" title={`Grup: ${product.groupCode}`}>
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

                            {/* SECTION 2: SEARCH RESULTS & BROWSING */}
                            <tr className="bg-slate-100/90 border-y border-slate-200 sticky top-[41px] z-10">
                                <td colSpan={9} className="px-4 py-2 font-bold text-slate-700 text-[11px]">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Search className="w-3.5 h-3.5 text-slate-500" />
                                            {searchQuery
                                                ? `ARAMA SONUÇLARI (${totalElements} Toplam Ürün Bulundu)`
                                                : `TÜM DİĞER ÜRÜNLER (${totalElements} Toplam)`}
                                            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600 ml-1" />}
                                        </span>

                                        {unselectedSearchResults.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleSelectAllVisible}
                                                className="text-red-600 hover:text-red-700 font-semibold text-[11px] hover:underline cursor-pointer flex items-center gap-1"
                                            >
                                                <CheckSquare className="w-3 h-3" />
                                                Sayfadaki Tümünü Seç ({unselectedSearchResults.length})
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>

                            {loading && searchResults.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
                                            <span className="text-xs font-medium">Ürünler aranıyor...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : unselectedSearchResults.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                                        {searchQuery
                                            ? "Aramanıza uygun başka ürün bulunamadı."
                                            : "Bu sayfadaki tüm ürünler zaten seçili veya ürün bulunamadı."}
                                    </td>
                                </tr>
                            ) : (
                                unselectedSearchResults.map((product) => {
                                    const id = product.productId || product.id;
                                    const img = product.images?.[0]?.url || product.imageUrl;
                                    const isInThisGroup = currentGroupId > 0 && product.groupCode === currentGroupCode;
                                    const hasOtherGroup = product.groupCode && product.groupCode !== currentGroupCode;

                                    return (
                                        <tr
                                            key={`unselected-${id}`}
                                            onClick={() => toggleProduct(product)}
                                            className="hover:bg-slate-50/90 transition-colors cursor-pointer border-l-4 border-l-transparent"
                                        >
                                            <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={false}
                                                    onChange={() => toggleProduct(product)}
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
                                            <td className="p-3.5">
                                                {formatPrice(product)}
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
                                                    <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md truncate max-w-[100px] block" title={`Grup: ${product.groupCode}`}>
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
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Controls & Pagination */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="font-semibold text-slate-700">
                                Toplam <b className="text-emerald-700 font-bold">{selectedCount}</b> ürün seçili
                            </span>
                        </div>

                        {/* Search Results Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                                <button
                                    type="button"
                                    disabled={page === 0 || loading}
                                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-2xs"
                                    title="Önceki Sayfa"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="font-semibold text-slate-600 text-xs">
                                    Sayfa {page + 1} / {totalPages}
                                </span>
                                <button
                                    type="button"
                                    disabled={page >= totalPages - 1 || loading}
                                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-2xs"
                                    title="Sonraki Sayfa"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
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

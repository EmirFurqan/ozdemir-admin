"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import SearchBar from "./SearchBar";
import { RotateCcw, Layers } from "lucide-react";

interface BrandOption {
    id: number;
    name: string;
}

interface CategoryOption {
    id: number;
    name: string;
    brand?: { id: number; name: string };
    brandId?: number;
}

interface ProductFilterBarProps {
    brands: BrandOption[];
    categories: CategoryOption[];
}

export default function ProductFilterBar({ brands = [], categories = [] }: ProductFilterBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentSearch = searchParams.get("search") || "";
    const currentBrandId = searchParams.get("brandId") || "";
    const currentCategoryId = searchParams.get("categoryId") || "";
    const currentGrouped = searchParams.get("grouped") !== "false"; // default to true

    // Filter categories dynamically based on selected brand
    const filteredCategories = useMemo(() => {
        if (!currentBrandId) return categories;
        return categories.filter((c) => {
            const bId = c.brandId || c.brand?.id;
            return !bId || bId.toString() === currentBrandId.toString();
        });
    }, [categories, currentBrandId]);

    // Save active filter to sessionStorage so back button always remembers
    useEffect(() => {
        const currentUrl = window.location.search;
        if (currentUrl) {
            sessionStorage.setItem("admin_products_filter", currentUrl);
        }
    }, [searchParams]);

    const handleBrandChange = useCallback(
        (newBrandId: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (newBrandId) {
                params.set("brandId", newBrandId);
            } else {
                params.delete("brandId");
            }

            // Check if existing category belongs to new brand
            if (currentCategoryId && newBrandId) {
                const validCat = categories.find((c) => {
                    const bId = c.brandId || c.brand?.id;
                    return c.id.toString() === currentCategoryId && (!bId || bId.toString() === newBrandId);
                });
                if (!validCat) {
                    params.delete("categoryId"); // Reset incompatible category
                }
            }

            params.delete("page");
            router.push("?" + params.toString());
        },
        [searchParams, categories, currentCategoryId, router]
    );

    const updateFilter = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value && value !== "all") {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            params.delete("page");
            router.push("?" + params.toString());
        },
        [searchParams, router]
    );

    const toggleGrouped = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (currentGrouped) {
            params.set("grouped", "false");
        } else {
            params.delete("grouped"); // default is true
        }
        params.delete("page");
        router.push("?" + params.toString());
    }, [currentGrouped, searchParams, router]);

    const resetFilters = useCallback(() => {
        sessionStorage.removeItem("admin_products_filter");
        router.push("/products");
    }, [router]);

    const hasActiveFilters = currentSearch || currentBrandId || currentCategoryId || !currentGrouped;

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search input */}
                <div className="w-full md:w-80">
                    <SearchBar defaultValue={currentSearch} placeholder="Ürün adı, kodu veya grup kodu ara..." />
                </div>

                {/* Filter dropdowns */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Brand Filter */}
                    <div className="flex items-center gap-1.5">
                        <select
                            value={currentBrandId}
                            onChange={(e) => handleBrandChange(e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block px-3 py-2 transition-colors cursor-pointer"
                        >
                            <option value="">Tüm Markalar</option>
                            {brands.map((b) => (
                                <option key={b.id} value={b.id.toString()}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category Filter (Filtered by selected brand) */}
                    <div className="flex items-center gap-1.5">
                        <select
                            value={currentCategoryId}
                            onChange={(e) => updateFilter("categoryId", e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block px-3 py-2 transition-colors cursor-pointer"
                        >
                            <option value="">Tüm Kategoriler</option>
                            {filteredCategories.map((c) => (
                                <option key={c.id} value={c.id.toString()}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Grouped Toggle */}
                    <button
                        type="button"
                        onClick={toggleGrouped}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${
                            currentGrouped
                                ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                        title="Varyasyonlu ürünleri tek kart olarak grupla veya tüm varyasyonları listele"
                    >
                        <Layers className="w-4 h-4" />
                        {currentGrouped ? "Gruplı Görünüm (Aktif)" : "Tüm Ürünler"}
                    </button>

                    {/* Reset Filters */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Temizle
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

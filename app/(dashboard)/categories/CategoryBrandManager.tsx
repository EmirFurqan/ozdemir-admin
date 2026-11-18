"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    Plus,
    Edit,
    Trash2,
    GripVertical,
    ArrowUp,
    ArrowDown,
    Search,
    CheckCircle2,
    Loader2,
    Layers,
    Award,
    AlertCircle,
} from "lucide-react";
import { Category } from "@/app/services/categoryService";
import { Brands } from "@/app/services/brandService";
import { reorderBrandsAction } from "@/app/actions/brand";
import { reorderCategoriesAction, deleteCategoryAction } from "@/app/actions/category";
import TableImage from "@/app/components/TableImage";
import { toast } from "sonner";

interface CategoryBrandManagerProps {
    initialBrands: Brands[];
    initialCategories: Category[];
    initialSelectedBrandId?: number;
}

export default function CategoryBrandManager({
    initialBrands,
    initialCategories,
    initialSelectedBrandId,
}: CategoryBrandManagerProps) {
    const [brands, setBrands] = useState<Brands[]>(initialBrands);
    const [categories, setCategories] = useState<Category[]>(initialCategories);

    // Default to first brand in the ordered list
    const [selectedBrandId, setSelectedBrandId] = useState<number | "unassigned">(
        initialSelectedBrandId || (initialBrands.length > 0 ? initialBrands[0].id : "unassigned")
    );

    const [categorySearch, setCategorySearch] = useState("");
    const [isSavingBrands, setIsSavingBrands] = useState(false);
    const [isSavingCategories, setIsSavingCategories] = useState(false);
    const [deletingCatId, setDeletingCatId] = useState<number | null>(null);

    // Drag state for Brands
    const [draggedBrandIndex, setDraggedBrandIndex] = useState<number | null>(null);
    const [dragOverBrandIndex, setDragOverBrandIndex] = useState<number | null>(null);

    // Drag state for Categories
    const [draggedCatIndex, setDraggedCatIndex] = useState<number | null>(null);
    const [dragOverCatIndex, setDragOverCatIndex] = useState<number | null>(null);

    // Count categories per brand
    const categoryCountsByBrand = useMemo(() => {
        const counts: Record<string, number> = { unassigned: 0 };
        for (const b of brands) {
            counts[b.id] = 0;
        }
        for (const cat of categories) {
            const bId = cat.brand?.id ?? cat.brandId;
            if (bId && counts[bId] !== undefined) {
                counts[bId] += 1;
            } else if (bId) {
                counts[bId] = (counts[bId] || 0) + 1;
            } else {
                counts.unassigned += 1;
            }
        }
        return counts;
    }, [brands, categories]);

    const selectedBrand = useMemo(() => {
        if (selectedBrandId === "unassigned") return null;
        return brands.find((b) => b.id === selectedBrandId) || null;
    }, [brands, selectedBrandId]);

    // Categories belonging to the currently selected brand, in their current order
    const brandCategories = useMemo(() => {
        return categories.filter((cat) => {
            const bId = cat.brand?.id ?? cat.brandId;
            if (selectedBrandId === "unassigned") {
                return !bId;
            }
            return Number(bId) === Number(selectedBrandId);
        });
    }, [categories, selectedBrandId]);

    // Filtered categories when search bar is used
    const displayedCategories = useMemo(() => {
        if (!categorySearch.trim()) return brandCategories;
        const q = categorySearch.toLowerCase().trim();
        return brandCategories.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.slug && c.slug.toLowerCase().includes(q))
        );
    }, [brandCategories, categorySearch]);

    // --- BRAND REORDERING ---
    const persistBrandOrder = async (newBrands: Brands[]) => {
        setBrands(newBrands);
        setIsSavingBrands(true);
        const ids = newBrands.map((b) => b.id);
        const res = await reorderBrandsAction(ids);
        setIsSavingBrands(false);
        if (res.success) {
            toast.success("Marka öncelik sıralaması güncellendi.");
        } else {
            toast.error(res.message || "Marka sıralaması kaydedilemedi.");
        }
    };

    const handleBrandDragStart = (index: number) => {
        setDraggedBrandIndex(index);
    };

    const handleBrandDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragOverBrandIndex !== index) {
            setDragOverBrandIndex(index);
        }
    };

    const handleBrandDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedBrandIndex === null || draggedBrandIndex === dropIndex) {
            setDraggedBrandIndex(null);
            setDragOverBrandIndex(null);
            return;
        }

        const updated = [...brands];
        const [moved] = updated.splice(draggedBrandIndex, 1);
        updated.splice(dropIndex, 0, moved);

        setDraggedBrandIndex(null);
        setDragOverBrandIndex(null);
        await persistBrandOrder(updated);
    };

    const moveBrand = async (index: number, direction: "up" | "down", e: React.MouseEvent) => {
        e.stopPropagation();
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= brands.length) return;

        const updated = [...brands];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        await persistBrandOrder(updated);
    };

    // --- CATEGORY REORDERING ---
    const persistCategoryOrder = async (newBrandCategories: Category[]) => {
        // Merge updated order of this brand's categories back into global categories state
        const otherCategories = categories.filter((cat) => {
            const bId = cat.brand?.id ?? cat.brandId;
            if (selectedBrandId === "unassigned") {
                return !!bId;
            }
            return Number(bId) !== Number(selectedBrandId);
        });

        setCategories([...otherCategories, ...newBrandCategories]);
        setIsSavingCategories(true);
        const ids = newBrandCategories.map((c) => c.id);
        const res = await reorderCategoriesAction(ids);
        setIsSavingCategories(false);
        if (res.success) {
            toast.success("Kategori öncelik sıralaması güncellendi.");
        } else {
            toast.error(res.message || "Kategori sıralaması kaydedilemedi.");
        }
    };

    const handleCatDragStart = (index: number) => {
        if (categorySearch.trim()) return;
        setDraggedCatIndex(index);
    };

    const handleCatDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (categorySearch.trim()) return;
        if (dragOverCatIndex !== index) {
            setDragOverCatIndex(index);
        }
    };

    const handleCatDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (categorySearch.trim()) return;
        if (draggedCatIndex === null || draggedCatIndex === dropIndex) {
            setDraggedCatIndex(null);
            setDragOverCatIndex(null);
            return;
        }

        const updated = [...brandCategories];
        const [moved] = updated.splice(draggedCatIndex, 1);
        updated.splice(dropIndex, 0, moved);

        setDraggedCatIndex(null);
        setDragOverCatIndex(null);
        await persistCategoryOrder(updated);
    };

    const moveCategory = async (index: number, direction: "up" | "down") => {
        if (categorySearch.trim()) return;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= brandCategories.length) return;

        const updated = [...brandCategories];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        await persistCategoryOrder(updated);
    };

    const handleDeleteCategory = async (cat: Category) => {
        if (!window.confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz?`)) {
            return;
        }
        setDeletingCatId(cat.id);
        const res = await deleteCategoryAction(cat.id);
        setDeletingCatId(null);
        if (res.success) {
            setCategories((prev) => prev.filter((c) => c.id !== cat.id));
            toast.success("Kategori silindi.");
        } else {
            toast.error(res.message || "Kategori silinemedi.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Marka &amp; Kategori Sıralaması
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Soldan marka seçerek o markanın kategorilerini yönetin. Sürükleyip bırakarak kurumsal sitedeki öncelik sırasını belirleyin.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/brands/new"
                        className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-xs"
                    >
                        <Plus className="w-4 h-4 text-slate-500" />
                        Yeni Marka
                    </Link>
                    <Link
                        href={
                            selectedBrandId && selectedBrandId !== "unassigned"
                                ? `/categories/new?brandId=${selectedBrandId}`
                                : "/categories/new"
                        }
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-red-200"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Kategori Ekle
                    </Link>
                </div>
            </div>

            {/* Split View: Left Brands List, Right Categories List */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: BRANDS LIST */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-red-600" />
                            <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                                Markalar ({brands.length})
                            </h2>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            {isSavingBrands ? (
                                <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Kaydediliyor...
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-slate-400">
                                    Sürükle &amp; Sırala
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[72vh] overflow-y-auto p-2 space-y-1">
                        {brands.map((brand, index) => {
                            const isSelected = Number(selectedBrandId) === Number(brand.id);
                            const isDragged = draggedBrandIndex === index;
                            const isDragOver = dragOverBrandIndex === index;
                            const catCount = categoryCountsByBrand[brand.id] || 0;

                            return (
                                <div
                                    key={brand.id}
                                    draggable
                                    onDragStart={() => handleBrandDragStart(index)}
                                    onDragOver={(e) => handleBrandDragOver(e, index)}
                                    onDrop={(e) => handleBrandDrop(e, index)}
                                    onDragEnd={() => {
                                        setDraggedBrandIndex(null);
                                        setDragOverBrandIndex(null);
                                    }}
                                    onClick={() => setSelectedBrandId(brand.id)}
                                    className={`group relative flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all select-none border ${
                                        isSelected
                                            ? "bg-red-50/80 border-red-500 shadow-xs"
                                            : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                                    } ${isDragged ? "opacity-40 scale-[0.98]" : "opacity-100"} ${
                                        isDragOver && !isDragged ? "ring-2 ring-red-500 bg-red-50/40" : ""
                                    }`}
                                >
                                    {/* Drag Handle */}
                                    <div
                                        className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 p-0.5"
                                        title="Sıralamak için sürükleyin"
                                    >
                                        <GripVertical className="w-4 h-4" />
                                    </div>

                                    {/* Priority Order Badge */}
                                    <span
                                        className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0 ${
                                            isSelected
                                                ? "bg-red-600 text-white"
                                                : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        {index + 1}
                                    </span>

                                    {/* Brand Logo */}
                                    <div className="flex-shrink-0">
                                        <TableImage
                                            src={brand.logoName}
                                            alt={brand.name}
                                            fallbackText={brand.name}
                                        />
                                    </div>

                                    {/* Brand Name & Count */}
                                    <div className="flex-1 min-w-0">
                                        <div
                                            className={`font-semibold text-sm truncate ${
                                                isSelected ? "text-red-700" : "text-slate-900"
                                            }`}
                                        >
                                            {brand.name}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            {catCount} kategori
                                        </div>
                                    </div>

                                    {/* Quick Up/Down & Edit Controls */}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={(e) => moveBrand(index, "up", e)}
                                            disabled={index === 0 || isSavingBrands}
                                            className="p-1 rounded hover:bg-slate-200/70 text-slate-500 disabled:opacity-25"
                                            title="Yukarı Taşı"
                                        >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => moveBrand(index, "down", e)}
                                            disabled={index === brands.length - 1 || isSavingBrands}
                                            className="p-1 rounded hover:bg-slate-200/70 text-slate-500 disabled:opacity-25"
                                            title="Aşağı Taşı"
                                        >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                        <Link
                                            href={`/brands/${brand.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1 rounded hover:bg-slate-200/70 text-slate-500 hover:text-red-600"
                                            title="Markayı Düzenle"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}

                        {categoryCountsByBrand.unassigned > 0 && (
                            <div
                                onClick={() => setSelectedBrandId("unassigned")}
                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border mt-2 ${
                                    selectedBrandId === "unassigned"
                                        ? "bg-amber-50 border-amber-400 text-amber-900"
                                        : "bg-slate-50 border-transparent hover:border-slate-200 text-slate-600"
                                }`}
                            >
                                <div className="flex items-center gap-2 text-xs font-medium">
                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                    <span>Markasız Kategoriler</span>
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    {categoryCountsByBrand.unassigned}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: SELECTED BRAND'S CATEGORIES */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {/* Right Header */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {selectedBrand ? (
                                <>
                                    <TableImage
                                        src={selectedBrand.logoName}
                                        alt={selectedBrand.name}
                                        fallbackText={selectedBrand.name}
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-bold text-slate-900">
                                                {selectedBrand.name} Kategorileri
                                            </h2>
                                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-600 border border-red-100">
                                                {brandCategories.length} Kategori
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Kategorileri sürükleyip bırakarak menü ve sayfa içi görünüm sırasını değiştirin.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Markasız Kategoriler ({brandCategories.length})
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Herhangi bir markaya atanmamış kategoriler.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {isSavingCategories && (
                                <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sıra kaydediliyor...
                                </span>
                            )}
                            <div className="relative w-full sm:w-56">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    placeholder="Kategori filtrele..."
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Categories List */}
                    {displayedCategories.length > 0 ? (
                        <div className="divide-y divide-slate-100 p-3 space-y-1.5">
                            {displayedCategories.map((cat, index) => {
                                const isDragged = draggedCatIndex === index;
                                const isDragOver = dragOverCatIndex === index;
                                const isSearchActive = !!categorySearch.trim();

                                return (
                                    <div
                                        key={cat.id}
                                        draggable={!isSearchActive}
                                        onDragStart={() => handleCatDragStart(index)}
                                        onDragOver={(e) => handleCatDragOver(e, index)}
                                        onDrop={(e) => handleCatDrop(e, index)}
                                        onDragEnd={() => {
                                            setDraggedCatIndex(null);
                                            setDragOverCatIndex(null);
                                        }}
                                        className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                            isDragged
                                                ? "opacity-40 scale-[0.99] bg-slate-50 border-slate-300"
                                                : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/70"
                                        } ${
                                            isDragOver && !isDragged
                                                ? "ring-2 ring-red-500 bg-red-50/30"
                                                : ""
                                        }`}
                                    >
                                        {/* Drag Handle */}
                                        {!isSearchActive && (
                                            <div
                                                className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 p-1"
                                                title="Sürükleyerek sıralayın"
                                            >
                                                <GripVertical className="w-4 h-4" />
                                            </div>
                                        )}

                                        {/* Order Number */}
                                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                                            {index + 1}
                                        </span>

                                        {/* Category Image */}
                                        <div className="flex-shrink-0">
                                            <TableImage
                                                src={cat.imageUrl}
                                                alt={cat.name}
                                                fallbackText={cat.name}
                                            />
                                        </div>

                                        {/* Category Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm text-slate-900 truncate">
                                                {cat.name}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="font-mono text-[11px] text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded">
                                                    /{cat.slug}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions: Up/Down + Edit + Delete */}
                                        <div className="flex items-center gap-1">
                                            {!isSearchActive && (
                                                <div className="flex items-center gap-0.5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveCategory(index, "up")}
                                                        disabled={index === 0 || isSavingCategories}
                                                        className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 disabled:opacity-25"
                                                        title="Yukarı Taşı"
                                                    >
                                                        <ArrowUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveCategory(index, "down")}
                                                        disabled={
                                                            index === displayedCategories.length - 1 ||
                                                            isSavingCategories
                                                        }
                                                        className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 disabled:opacity-25"
                                                        title="Aşağı Taşı"
                                                    >
                                                        <ArrowDown className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}

                                            <Link
                                                href={`/categories/${cat.id}`}
                                                className="p-2 hover:bg-slate-200/70 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
                                                title="Kategoriyi Düzenle"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCategory(cat)}
                                                disabled={deletingCatId === cat.id}
                                                className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                title="Kategoriyi Sil"
                                            >
                                                {deletingCatId === cat.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <Layers className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-slate-900">
                                    {categorySearch.trim()
                                        ? "Aramanızla eşleşen kategori bulunamadı"
                                        : "Bu markaya ait henüz kategori yok"}
                                </p>
                                <p className="text-xs text-slate-500 max-w-sm">
                                    {categorySearch.trim()
                                        ? "Farklı bir anahtar kelime deneyin veya filtreyi temizleyin."
                                        : selectedBrand
                                        ? `${selectedBrand.name} markası için hemen yeni bir kategori ekleyebilirsiniz.`
                                        : "Kategori ekleyerek başlayın."}
                                </p>
                            </div>
                            {!categorySearch.trim() && selectedBrand && (
                                <Link
                                    href={`/categories/new?brandId=${selectedBrand.id}`}
                                    className="mt-2 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs"
                                >
                                    <Plus className="w-4 h-4" />
                                    {selectedBrand.name} İçin Kategori Ekle
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    Plus,
    Edit,
    Trash2,
    GripVertical,
    ArrowUp,
    ArrowDown,
    Layers,
    Loader2,
} from "lucide-react";
import { Brands } from "@/app/services/brandService";
import { reorderBrandsAction, deleteBrandAction } from "@/app/actions/brand";
import TableImage from "@/app/components/TableImage";
import { toast } from "sonner";

interface BrandsManagerProps {
    initialBrands: Brands[];
}

export default function BrandsManager({ initialBrands }: BrandsManagerProps) {
    const [brands, setBrands] = useState<Brands[]>(initialBrands);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const persistOrder = async (newBrands: Brands[]) => {
        setBrands(newBrands);
        setIsSaving(true);
        const ids = newBrands.map((b) => b.id);
        const res = await reorderBrandsAction(ids);
        setIsSaving(false);
        if (res.success) {
            toast.success("Marka sıralaması güncellendi.");
        } else {
            toast.error(res.message || "Sıralama kaydedilemedi.");
        }
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }
        const updated = [...brands];
        const [moved] = updated.splice(draggedIndex, 1);
        updated.splice(dropIndex, 0, moved);
        setDraggedIndex(null);
        setDragOverIndex(null);
        await persistOrder(updated);
    };

    const moveBrand = async (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= brands.length) return;
        const updated = [...brands];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        await persistOrder(updated);
    };

    const handleDelete = async (brand: Brands) => {
        if (!window.confirm(`"${brand.name}" markasını silmek istediğinize emin misiniz?`)) {
            return;
        }
        setDeletingId(brand.id);
        const res = await deleteBrandAction(brand.id);
        setDeletingId(null);
        if (res.success) {
            setBrands((prev) => prev.filter((b) => b.id !== brand.id));
            toast.success("Marka silindi.");
        } else {
            toast.error(res.message || "Marka silinemedi.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Markalar</h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Markaları sürükleyip bırakarak kurumsal sitedeki öncelik sırasını belirleyebilirsiniz.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isSaving && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sıralama kaydediliyor...
                        </span>
                    )}
                    <Link
                        href="/brands/new"
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-red-200"
                    >
                        <Plus className="w-5 h-5" />
                        Yeni Marka Ekle
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {brands.length > 0 ? (
                    <div className="divide-y divide-slate-100 p-3 space-y-1.5">
                        {brands.map((brand, index) => {
                            const isDragged = draggedIndex === index;
                            const isDragOver = dragOverIndex === index;

                            return (
                                <div
                                    key={brand.id}
                                    draggable
                                    onDragStart={() => setDraggedIndex(index)}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (dragOverIndex !== index) setDragOverIndex(index);
                                    }}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={() => {
                                        setDraggedIndex(null);
                                        setDragOverIndex(null);
                                    }}
                                    className={`group flex items-center gap-4 p-3.5 rounded-xl border transition-all ${
                                        isDragged
                                            ? "opacity-40 scale-[0.99] bg-slate-50 border-slate-300"
                                            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/70"
                                    } ${isDragOver && !isDragged ? "ring-2 ring-red-500 bg-red-50/30" : ""}`}
                                >
                                    <div
                                        className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 p-1"
                                        title="Sürükleyerek sıralayın"
                                    >
                                        <GripVertical className="w-4 h-4" />
                                    </div>

                                    <span className="w-7 h-7 rounded-lg bg-red-50 text-red-600 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                                        {index + 1}
                                    </span>

                                    <TableImage
                                        src={brand.logoName}
                                        alt={brand.name}
                                        fallbackText={brand.name}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-900 truncate">
                                            {brand.name}
                                        </div>
                                        <span className="font-mono text-xs text-slate-400">
                                            /{brand.slug}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <Link
                                            href={`/categories?brandId=${brand.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 transition-colors"
                                        >
                                            <Layers className="w-3.5 h-3.5" />
                                            Kategorileri Yönet
                                        </Link>

                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => moveBrand(index, "up")}
                                                disabled={index === 0 || isSaving}
                                                className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 disabled:opacity-25"
                                                title="Yukarı Taşı"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveBrand(index, "down")}
                                                disabled={index === brands.length - 1 || isSaving}
                                                className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 disabled:opacity-25"
                                                title="Aşağı Taşı"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <Link
                                            href={`/brands/${brand.id}`}
                                            className="p-2 hover:bg-slate-200/70 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
                                            title="Düzenle"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(brand)}
                                            disabled={deletingId === brand.id}
                                            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                            title="Sil"
                                        >
                                            {deletingId === brand.id ? (
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
                    <div className="p-12 text-center text-slate-500">
                        Henüz marka eklenmemiş.
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { bulkAssignGroupAction, removeProductFromGroup } from "@/app/actions/productGroup";
import { Trash2, Plus, ExternalLink, Save, Check, RefreshCw, Image as ImageIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface GroupImage {
    url: string;
    isMain: boolean;
    displayOrder: number;
}

interface GroupFeature {
    feature: string;
    description: string;
    displayOrder: number;
}

interface VariantProduct {
    productId: number;
    name: string;
    variantLabel: string;
    code: string;
    price: number;
    stock: number;
}

export default function ProductGroupProductsManager({
    group,
    groupId,
    products,
    allProducts
}: {
    group?: any;
    groupId: number;
    products: any[];
    allProducts: any[];
}) {
    const [selectedProductId, setSelectedProductId] = useState("");
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Shared fields
    const [groupDescription, setGroupDescription] = useState(group?.description || "");
    const [images, setImages] = useState<GroupImage[]>([]);
    const [features, setFeatures] = useState<GroupFeature[]>([]);

    // Product variants list
    const [variants, setVariants] = useState<VariantProduct[]>([]);

    useEffect(() => {
        if (products && products.length > 0) {
            setVariants(
                products.map((p) => ({
                    productId: p.id,
                    name: p.name || "",
                    variantLabel: p.variantLabel || "",
                    code: p.code || "",
                    price: p.price || 0,
                    stock: p.stock || 0,
                }))
            );

            // Populate images from first product if available
            if (products[0].images && products[0].images.length > 0) {
                setImages(
                    products[0].images.map((img: any) => ({
                        url: img.url,
                        isMain: img.isMain,
                        displayOrder: img.displayOrder || 0,
                    }))
                );
            } else if (group?.imageUrl) {
                setImages([{ url: group.imageUrl, isMain: true, displayOrder: 0 }]);
            }

            // Populate description if missing on group but present on product
            if (!groupDescription && products[0].description) {
                setGroupDescription(products[0].description);
            }

            // Populate features
            if (products[0].features && products[0].features.length > 0) {
                setFeatures(
                    products[0].features.map((f: any) => ({
                        feature: f.feature,
                        description: f.description,
                        displayOrder: f.displayOrder || 0,
                    }))
                );
            }
        }
    }, [products, group]);

    // Options for combobox
    const availableProducts = allProducts
        ? allProducts
              .filter((p) => !variants.some((v) => v.productId === p.id))
              .map((p) => ({
                  value: p.id.toString(),
                  label: `${p.code} - ${p.name}`,
              }))
        : [];

    const handleAddSelectedProduct = () => {
        if (!selectedProductId) return;
        const id = parseInt(selectedProductId, 10);
        const prod = allProducts.find((p) => p.id === id);
        if (!prod) return;

        setVariants([
            ...variants,
            {
                productId: prod.id,
                name: prod.name || "",
                variantLabel: prod.variantLabel || "",
                code: prod.code || "",
                price: prod.price || 0,
                stock: prod.stock || 0,
            },
        ]);
        setSelectedProductId("");
    };

    const handleRemoveVariant = async (productId: number) => {
        setVariants(variants.filter((v) => v.productId !== productId));
    };

    const handleUpdateVariant = (index: number, field: keyof VariantProduct, value: any) => {
        const updated = [...variants];
        updated[index] = { ...updated[index], [field]: value };
        setVariants(updated);
    };

    // Images logic
    const handleAddImage = (url: string) => {
        if (!url.trim()) return;
        setImages([
            ...images,
            {
                url: url.trim(),
                isMain: images.length === 0,
                displayOrder: images.length,
            },
        ]);
    };

    const handleRemoveImage = (idx: number) => {
        const updated = images.filter((_, i) => i !== idx);
        if (updated.length > 0 && !updated.some((img) => img.isMain)) {
            updated[0].isMain = true;
        }
        setImages(updated);
    };

    const handleSetMainImage = (idx: number) => {
        setImages(
            images.map((img, i) => ({
                ...img,
                isMain: i === idx,
            }))
        );
    };

    // Features logic
    const handleAddFeature = () => {
        setFeatures([...features, { feature: "", description: "", displayOrder: features.length }]);
    };

    const handleUpdateFeature = (idx: number, key: "feature" | "description", val: string) => {
        const updated = [...features];
        updated[idx][key] = val;
        setFeatures(updated);
    };

    const handleRemoveFeature = (idx: number) => {
        setFeatures(features.filter((_, i) => i !== idx));
    };

    // Bulk Save & Sync
    const handleSaveGroupAndSync = async () => {
        if (!group?.groupCode) {
            setStatusMessage({ type: "error", text: "Grup kodu bulunamadı." });
            return;
        }

        setSaving(true);
        setStatusMessage(null);

        try {
            const payload = {
                groupId,
                groupCode: group.groupCode,
                groupName: group.name,
                description: groupDescription,
                images,
                features,
                products: variants,
            };

            const res = await bulkAssignGroupAction(payload);
            if (res.success) {
                setStatusMessage({
                    type: "success",
                    text: "Ortak bilgiler ve varyant etiketleri tüm ürünlere senkronize edildi!",
                });
            } else {
                setStatusMessage({ type: "error", text: res.message || "Hata oluştu." });
            }
        } catch (e: any) {
            console.error("Save error:", e);
            setStatusMessage({ type: "error", text: "Kaydedilirken beklenmeyen bir hata oluştu." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Status Message */}
            {statusMessage && (
                <div
                    className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
                        statusMessage.type === "success"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {statusMessage.type === "success" ? <Check className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                        {statusMessage.text}
                    </div>
                </div>
            )}

            {/* Shared Details Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-red-600" />
                            Grup Ortak Detayları (Tüm Alt Ürünlere Uygulanır)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Buradaki açıklama, görseller ve teknik özellikler gruptaki tüm ürünler için geçerli olacaktır.
                        </p>
                    </div>
                </div>

                {/* Shared Description */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Ortak Ürün Açıklaması
                    </label>
                    <textarea
                        rows={4}
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        placeholder="Gruptaki tüm ürünlerin ortak açıklama metnini buraya yazın..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                </div>

                {/* Shared Images */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Ortak Ürün Görselleri
                    </label>
                    <div className="flex gap-2">
                        <Input
                            id="adminImgInput"
                            placeholder="Görsel URL veya dosya yolu ekleyin (/uploads/resim.png)"
                            className="bg-slate-50 text-xs"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddImage(e.currentTarget.value);
                                    e.currentTarget.value = "";
                                }
                            }}
                        />
                        <Button
                            type="button"
                            onClick={() => {
                                const el = document.getElementById("adminImgInput") as HTMLInputElement;
                                if (el && el.value) {
                                    handleAddImage(el.value);
                                    el.value = "";
                                }
                            }}
                            className="bg-slate-900 text-white text-xs"
                        >
                            Ekle
                        </Button>
                    </div>

                    {images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`relative p-2 rounded-lg border bg-slate-50 flex flex-col items-center gap-2 ${
                                        img.isMain ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-200"
                                    }`}
                                >
                                    <div className="w-full aspect-square relative rounded bg-white overflow-hidden border">
                                        <Image
                                            src={img.url.startsWith("http") ? img.url : img.url}
                                            alt={`Görsel ${idx + 1}`}
                                            fill
                                            className="object-contain p-1"
                                        />
                                    </div>
                                    <div className="w-full flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => handleSetMainImage(idx)}
                                            className={`text-[10px] px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                                img.isMain ? "bg-red-600 text-white" : "bg-slate-200 text-slate-700"
                                            }`}
                                        >
                                            {img.isMain ? "Ana Görsel" : "Ana Yap"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Shared Features */}
                <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Ortak Teknik Özellikler
                        </label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddFeature}
                            className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Özellik Ekle
                        </Button>
                    </div>

                    {features.map((feat, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <Input
                                placeholder="Özellik (Örn: Depo Hacmi)"
                                value={feat.feature}
                                onChange={(e) => handleUpdateFeature(idx, "feature", e.target.value)}
                                className="bg-slate-50 text-xs"
                            />
                            <Input
                                placeholder="Değer (Örn: 600 cc)"
                                value={feat.description}
                                onChange={(e) => handleUpdateFeature(idx, "description", e.target.value)}
                                className="bg-slate-50 text-xs"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveFeature(idx)}
                                className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Products & Variants List */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Grup Ürünleri & Varyant Etiketleri</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Her bir ürünün farkını belirten Varyant Etiketini (`10 mm`, `15 mm` vb.) buradan bağımsız düzenleyebilirsiniz.
                        </p>
                    </div>
                    <span className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1 rounded-full">
                        {variants.length} Varyant
                    </span>
                </div>

                {/* Add Existing Product to Group */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Gruba Var Olan Başka Bir Ürün Ekle
                    </label>
                    <div className="flex gap-3 items-center">
                        <div className="flex-1">
                            <Combobox
                                options={availableProducts}
                                value={selectedProductId}
                                onChange={setSelectedProductId}
                                placeholder="Eklenecek Ürünü Seçin..."
                                searchPlaceholder="Kod veya isim yazarak arayın..."
                                emptyText="Uygun ürün bulunamadı."
                            />
                        </div>
                        <Button
                            type="button"
                            disabled={!selectedProductId}
                            onClick={handleAddSelectedProduct}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Gruba Dahil Et
                        </Button>
                    </div>
                </div>

                {/* Variants Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 w-20">ID / Kod</th>
                                <th className="px-4 py-3">Ürün İsmi</th>
                                <th className="px-4 py-3">Varyant Etiketi</th>
                                <th className="px-4 py-3 w-28">Fiyat</th>
                                <th className="px-4 py-3 w-24">Stok</th>
                                <th className="px-4 py-3 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {variants.map((v, idx) => (
                                <tr key={v.productId} className="hover:bg-slate-50/80">
                                    <td className="px-4 py-3 font-mono text-slate-600 font-medium text-xs">
                                        #{v.productId}<br/><span className="text-slate-400 font-normal">{v.code}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Input
                                            type="text"
                                            value={v.name}
                                            onChange={(e) => handleUpdateVariant(idx, "name", e.target.value)}
                                            placeholder="Ürün ismi..."
                                            className="bg-white text-xs text-slate-900 border-slate-300"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Input
                                            type="text"
                                            value={v.variantLabel}
                                            onChange={(e) => handleUpdateVariant(idx, "variantLabel", e.target.value)}
                                            placeholder="Örn: 10 mm veya Nozzle 1.5"
                                            className="bg-white text-xs font-semibold text-slate-900 border-slate-300"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Input
                                            type="number"
                                            value={v.price}
                                            onChange={(e) => handleUpdateVariant(idx, "price", parseFloat(e.target.value) || 0)}
                                            className="bg-white text-xs"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Input
                                            type="number"
                                            value={v.stock}
                                            onChange={(e) => handleUpdateVariant(idx, "stock", parseInt(e.target.value, 10) || 0)}
                                            className="bg-white text-xs"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveVariant(v.productId)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                                            title="Gruptan Çıkar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Main Action Bar */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                        {variants.length} ürün grupta senkronize edilecek.
                    </span>

                    <Button
                        type="button"
                        onClick={handleSaveGroupAndSync}
                        disabled={saving}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-md cursor-pointer transition-all"
                    >
                        {saving ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Tüm Gruba Senkronize Ediliyor...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Tüm Gruba Uygula ve Kaydet
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

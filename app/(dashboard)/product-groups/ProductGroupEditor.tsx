"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { bulkAssignGroupAction, deleteProductGroupAction } from "@/app/actions/productGroup";
import { getProductsForSelect } from "@/app/actions/product";
import {
    ArrowLeft,
    Save,
    Check,
    RefreshCw,
    Plus,
    Trash2,
    ImageIcon,
    Layers,
    Sparkles,
    FileText,
    Sliders,
    Info,
    ExternalLink,
    Upload,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ToggleLeft,
    ToggleRight,
    ChevronDown,
    ChevronUp,
    X
} from "lucide-react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false }) as any;

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
    images?: GroupImage[];
}

export default function ProductGroupEditor({
    group,
    groupId,
    products,
    allProducts,
    brands = [],
    categories = [],
}: {
    group: any;
    groupId: number;
    products: any[];
    allProducts: any[];
    brands?: any[];
    categories?: any[];
}) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form fields
    const [groupCode, setGroupCode] = useState(group?.groupCode || "");
    const [groupName, setGroupName] = useState(group?.name || "");
    const [groupDescription, setGroupDescription] = useState(group?.description || "");
    const [brandId, setBrandId] = useState<string>("");
    const [categoryId, setCategoryId] = useState<string>("");

    // Shared assets
    const [images, setImages] = useState<GroupImage[]>([]);
    const [features, setFeatures] = useState<GroupFeature[]>([]);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Individual images mode
    const [individualImages, setIndividualImages] = useState(false);
    const [expandedVariantImages, setExpandedVariantImages] = useState<number | null>(null);
    const [isUploadingVariantImage, setIsUploadingVariantImage] = useState<number | null>(null);

    // Product variants
    const [variants, setVariants] = useState<VariantProduct[]>([]);

    // Combobox selection for adding existing product to group
    const [selectedProductId, setSelectedProductId] = useState("");

    // Helper for image URLs from backend
    const getImageUrl = (url: string) => {
        if (!url) return "/assets/product-placeholder.png";
        if (url.startsWith("http")) return url;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";
        const cleanUrl = url.startsWith("/") ? url : `/${url}`;
        return `${baseUrl}${cleanUrl}`;
    };

    // Quill Image Upload Handler
    const quillRef = useRef<any>(null);

    const imageHandler = useCallback(() => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.click();

        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const formData = new FormData();
                formData.append("file", file);
                formData.append("type", "description");

                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                        method: "POST",
                        body: formData,
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";
                        const url = baseUrl + data.url;
                        const quill = quillRef.current.getEditor();
                        const range = quill.getSelection();
                        quill.insertEmbed(range.index, "image", url);
                    } else {
                        alert("Resim yüklenemedi.");
                    }
                } catch (error) {
                    console.error("Upload error:", error);
                    alert("Resim yüklenirken hata oluştu.");
                }
            }
        };
    }, []);

    const modules = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ color: [] }, { background: [] }],
                    [{ align: [] }],
                    ["link", "image"],
                    ["clean"],
                ],
                handlers: {
                    image: imageHandler,
                },
            },
        }),
        [imageHandler]
    );

    useEffect(() => {
        if (products && products.length > 0) {
            // Determine if products have different images (individual mode detection)
            const distinctImages = new Set(products.map((p) => p.imageUrl).filter(Boolean));
            const isIndividualMode = group?.individualImages === true || (products.length > 1 && distinctImages.size > 1);

            if (isIndividualMode) {
                setIndividualImages(true);
            }

            setVariants(
                products.map((p) => ({
                    productId: p.id,
                    name: p.name || "",
                    variantLabel: p.variantLabel || "",
                    code: p.code || "",
                    price: p.price || 0,
                    stock: p.stock || 0,
                    images: isIndividualMode && p.images ? p.images.map((img: any) => ({
                        url: img.url,
                        isMain: img.isMain,
                        displayOrder: img.displayOrder || 0,
                    })) : [],
                }))
            );

            // Populate shared images from group or first product
            if (group?.imageUrl) {
                setImages([{ url: group.imageUrl, isMain: true, displayOrder: 0 }]);
            } else if (!isIndividualMode && products[0]?.images && products[0].images.length > 0) {
                setImages(
                    products[0].images.map((img: any) => ({
                        url: img.url,
                        isMain: img.isMain,
                        displayOrder: img.displayOrder || 0,
                    }))
                );
            } else {
                setImages([]);
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

            // Populate brand & category from products if available
            const bId = products[0].brand?.id || products[0].brandId;
            if (bId) setBrandId(bId.toString());

            const cId = products[0].category?.id || products[0].categoryId;
            if (cId) setCategoryId(cId.toString());
        }
    }, [products, group]);

    const filteredCategories = useMemo(() => {
        if (!brandId) return categories;
        return categories.filter((c: any) => {
            const bId = c.brandId || c.brand?.id;
            return !bId || bId.toString() === brandId.toString();
        });
    }, [categories, brandId]);
    // Selectable products for group addition
    const [selectProducts, setSelectProducts] = useState<any[]>(allProducts || []);

    useEffect(() => {
        if (!selectProducts || selectProducts.length === 0) {
            getProductsForSelect().then((data) => {
                setSelectProducts(data || []);
            });
        }
    }, []);

    // Combobox options
    const availableProducts = useMemo(() => {
        if (!selectProducts) return [];
        return selectProducts
            .filter((p) => !variants.some((v) => v.productId === p.id))
            .map((p) => ({
                value: p.id.toString(),
                label: `${p.code ? p.code + ' - ' : ''}${p.name}`,
            }));
    }, [selectProducts, variants]);

    const handleAddSelectedProduct = () => {
        if (!selectedProductId) return;
        const id = parseInt(selectedProductId, 10);
        const prod = selectProducts.find((p) => p.id === id);
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

    const handleRemoveVariant = (productId: number) => {
        setVariants(variants.filter((v) => v.productId !== productId));
    };

    const handleUpdateVariant = (index: number, field: keyof VariantProduct, value: any) => {
        const updated = [...variants];
        updated[index] = { ...updated[index], [field]: value };
        setVariants(updated);
    };

    // File Upload Handler for Images
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setIsUploadingImage(true);
        const files = Array.from(e.target.files);

        for (const file of files) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", "product");

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                    method: "POST",
                    body: formData,
                });

                if (res.ok) {
                    const data = await res.json();
                    setImages((prev) => [
                        ...prev,
                        {
                            url: data.url,
                            isMain: prev.length === 0,
                            displayOrder: prev.length,
                        },
                    ]);
                } else {
                    alert("Resim yüklenirken hata oluştu.");
                }
            } catch (error) {
                console.error("Upload error:", error);
                alert("Resim yükleme hatası.");
            }
        }
        setIsUploadingImage(false);
        e.target.value = "";
    };

    // Variant Image Upload Handler
    const handleVariantFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantIndex: number) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setIsUploadingVariantImage(variantIndex);
        const files = Array.from(e.target.files);

        for (const file of files) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", "product");

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                    method: "POST",
                    body: formData,
                });

                if (res.ok) {
                    const data = await res.json();
                    setVariants((prev) => {
                        const updated = [...prev];
                        const existingImages = updated[variantIndex].images || [];
                        updated[variantIndex] = {
                            ...updated[variantIndex],
                            images: [
                                ...existingImages,
                                {
                                    url: data.url,
                                    isMain: existingImages.length === 0,
                                    displayOrder: existingImages.length,
                                },
                            ],
                        };
                        return updated;
                    });
                } else {
                    alert("Resim yüklenirken hata oluştu.");
                }
            } catch (error) {
                console.error("Upload error:", error);
                alert("Resim yükleme hatası.");
            }
        }
        setIsUploadingVariantImage(null);
        e.target.value = "";
    };

    const handleRemoveVariantImage = (variantIndex: number, imgIndex: number) => {
        setVariants((prev) => {
            const updated = [...prev];
            const imgs = [...(updated[variantIndex].images || [])];
            imgs.splice(imgIndex, 1);
            // Reassign main if needed
            if (imgs.length > 0 && !imgs.some((i) => i.isMain)) {
                imgs[0].isMain = true;
            }
            imgs.forEach((img, i) => (img.displayOrder = i));
            updated[variantIndex] = { ...updated[variantIndex], images: imgs };
            return updated;
        });
    };

    const handleSetVariantMainImage = (variantIndex: number, imgIndex: number) => {
        setVariants((prev) => {
            const updated = [...prev];
            const imgs = (updated[variantIndex].images || []).map((img, i) => ({
                ...img,
                isMain: i === imgIndex,
            }));
            updated[variantIndex] = { ...updated[variantIndex], images: imgs };
            return updated;
        });
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

    const handleMoveImage = (idx: number, direction: "left" | "right") => {
        if (direction === "left" && idx === 0) return;
        if (direction === "right" && idx === images.length - 1) return;
        const targetIdx = direction === "left" ? idx - 1 : idx + 1;
        const updated = [...images];
        const temp = updated[idx];
        updated[idx] = updated[targetIdx];
        updated[targetIdx] = temp;
        updated.forEach((img, i) => (img.displayOrder = i));
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

    // Main Save & Sync
    const handleSaveGroupAndSync = async () => {
        if (!groupCode.trim()) {
            setStatusMessage({ type: "error", text: "Grup kodu boş olamaz!" });
            return;
        }

        setSaving(true);
        setStatusMessage(null);

        try {
            const payload = {
                groupId,
                groupCode: groupCode.trim(),
                groupName: groupName.trim() || groupCode.trim(),
                brandId: brandId ? parseInt(brandId, 10) : null,
                categoryId: categoryId ? parseInt(categoryId, 10) : null,
                description: groupDescription,
                images,
                features,
                individualImages,
                products: variants.map((v) => ({
                    ...v,
                    images: individualImages ? (v.images || []) : undefined,
                })),
            };

            const res = await bulkAssignGroupAction(payload);
            if (res.success) {
                setStatusMessage({
                    type: "success",
                    text: "Tüm grup ortak detayları ve alt ürünler başarıyla güncellendi!",
                });
            } else {
                setStatusMessage({ type: "error", text: res.message || "Grup güncellenirken hata oluştu." });
            }
        } catch (e: any) {
            console.error("Save error:", e);
            setStatusMessage({ type: "error", text: "Beklenmeyen bir hata oluştu." });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGroup = async () => {
        const confirmed = window.confirm(
            `"${groupName || groupCode}" isimli ürün grubunu silmek istediğinizden emin misiniz?\n\nNOT: Grubun içindeki ürünler SİLİNMEYECEK, yalnızca grup bağları kaldırılacaktır.`
        );
        if (!confirmed) return;

        try {
            const res = await deleteProductGroupAction(groupId);
            if (res.success) {
                router.push("/product-groups");
            } else {
                alert(res.message || "Grup silinirken hata oluştu.");
            }
        } catch (e) {
            console.error(e);
            alert("Grup silinirken beklenmeyen bir hata oluştu.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-16">
            {/* Header Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-4">
                    <Link
                        href="/product-groups"
                        className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-red-50 text-red-600 px-2.5 py-0.5 rounded-md">
                                {groupCode || "Grup Düzenleme"}
                            </span>
                            <span className="text-xs text-slate-400">ID: #{groupId}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mt-1">
                            {groupName || "Ürün Grubu Düzenle"}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleDeleteGroup}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-sm px-4 py-3 rounded-xl transition-all cursor-pointer"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Grubu Sil
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSaveGroupAndSync}
                        disabled={saving}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-7 py-3 rounded-xl shadow-sm transition-all cursor-pointer"
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

            {/* Status Message */}
            {statusMessage && (
                <div
                    className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-xs ${
                        statusMessage.type === "success"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                    {statusMessage.type === "success" ? <Check className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    {statusMessage.text}
                </div>
            )}

            {/* SECTION 1: Temel Grup Bilgileri */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Layers className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-slate-900 text-base">1. Temel Grup Bilgileri</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Grup Kodu <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            value={groupCode}
                            onChange={(e) => setGroupCode(e.target.value)}
                            placeholder="Örn: 8100XX"
                            className="bg-slate-50 font-mono font-medium text-sm border-slate-200"
                        />
                        <p className="text-[11px] text-slate-400">
                            Gruba bağlı ürünlerin gruplanmasını sağlayan benzersiz kod.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Grup Adı
                        </label>
                        <Input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Örn: Üstten Depo Tabancalar"
                            className="bg-slate-50 text-sm border-slate-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Ortak Marka
                        </label>
                        <select
                            value={brandId}
                            onChange={(e) => {
                                setBrandId(e.target.value);
                                if (categoryId && e.target.value) {
                                    const validCat = categories.find((c: any) => {
                                        const bId = c.brandId || c.brand?.id;
                                        return c.id.toString() === categoryId && (!bId || bId.toString() === e.target.value);
                                    });
                                    if (!validCat) setCategoryId("");
                                }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 px-3 py-2 cursor-pointer font-medium"
                        >
                            <option value="">-- Marka Seçin --</option>
                            {brands.map((b: any) => (
                                <option key={b.id} value={b.id.toString()}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-slate-400">
                            Kaydettiğinizde gruptaki tüm alt ürünlerin markası topluca güncellenir.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Ortak Kategori
                        </label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 px-3 py-2 cursor-pointer font-medium"
                        >
                            <option value="">-- Kategori Seçin --</option>
                            {filteredCategories.map((c: any) => (
                                <option key={c.id} value={c.id.toString()}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-slate-400">
                            Kaydettiğinizde gruptaki tüm alt ürünlerin kategorisi topluca güncellenir.
                        </p>
                    </div>
                </div>
            </div>

            {/* SECTION 2: Ortak Ürün Açıklaması (Rich Editor) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-red-600" />
                        <div>
                            <h3 className="font-bold text-slate-900 text-base">
                                2. Ortak Ürün Açıklaması (Tüm Alt Ürünlere Uygulanır)
                            </h3>
                        </div>
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        Zengin Metin Editörü
                    </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                    Buraya yazacağınız açıklama ve biçimlendirmeler (HTML metin, resim, tablo vb.), kaydettiğinizde gruptaki tüm alt ürünlerin açıklama alanına otomatik olarak kopyalanacaktır.
                </p>

                <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={groupDescription}
                        onChange={setGroupDescription}
                        modules={modules}
                        placeholder="Gruba ait ortak ürün detaylarını buraya yazın..."
                        className="min-h-[220px]"
                    />
                </div>
            </div>

            {/* SECTION 3: Ortak Görseller ve Teknik Özellikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Images Manager */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-red-600" />
                                <h3 className="font-bold text-slate-900 text-base">
                                    {individualImages ? "Ortak Görseller" : "Ortak Görseller"}
                                </h3>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Individual Images Toggle */}
                                <button
                                    type="button"
                                    onClick={() => setIndividualImages(!individualImages)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                        individualImages
                                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                    }`}
                                    title={individualImages ? "Bireysel resimler aktif — her ürünün kendi resimleri olabilir" : "Tüm ürünler aynı resimleri paylaşır"}
                                >
                                    {individualImages ? (
                                        <ToggleRight className="w-4 h-4 text-amber-600" />
                                    ) : (
                                        <ToggleLeft className="w-4 h-4" />
                                    )}
                                    {individualImages ? "Bireysel Resimler Aktif" : "Bireysel Resimler"}
                                </button>
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                                    {images.length} Resim
                                </span>
                            </div>
                        </div>
                        {individualImages && (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    <strong>Bireysel resim modu aktif.</strong> Aşağıdaki ortak resimler yine tüm ürünlere uygulanır. Ek olarak, ürün tablosunda her ürüne özel resim yükleyebilirsiniz. Bireysel resimler ortak resimlerin önünde gösterilir.
                                </p>
                            </div>
                        )}

                        {/* File Upload + Text URL Input */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <label className="cursor-pointer bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all">
                                {isUploadingImage ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Yükleniyor...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Dosya Seç & Yükle
                                    </>
                                )}
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploadingImage}
                                />
                            </label>

                            <div className="flex flex-1 gap-1">
                                <Input
                                    id="editorImgInput"
                                    placeholder="veya Görsel URL yazın..."
                                    className="bg-slate-50 text-xs flex-1 border-slate-200"
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
                                        const el = document.getElementById("editorImgInput") as HTMLInputElement;
                                        if (el && el.value) {
                                            handleAddImage(el.value);
                                            el.value = "";
                                        }
                                    }}
                                    className="bg-slate-900 text-white text-xs px-3"
                                >
                                    Ekle
                                </Button>
                            </div>
                        </div>

                        {images.length === 0 ? (
                            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs text-slate-400">Grupta tanımlı ortak resim bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                                {images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className={`relative p-2 rounded-xl border bg-slate-50 flex flex-col items-center gap-2 ${
                                            img.isMain ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-200"
                                        }`}
                                    >
                                        <div className="w-full aspect-square relative rounded-lg bg-white overflow-hidden border border-slate-100">
                                            <Image
                                                src={getImageUrl(img.url)}
                                                alt={`Görsel ${idx + 1}`}
                                                fill
                                                className="object-contain p-1"
                                                unoptimized
                                            />
                                        </div>
                                        <div className="w-full flex items-center justify-between gap-1">
                                            <div className="flex items-center gap-0.5">
                                                <button
                                                    type="button"
                                                    disabled={idx === 0}
                                                    onClick={() => handleMoveImage(idx, "left")}
                                                    className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                    title="Sola Taşı"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={idx === images.length - 1}
                                                    onClick={() => handleMoveImage(idx, "right")}
                                                    className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                    title="Sağa Taşı"
                                                >
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleSetMainImage(idx)}
                                                className={`text-[10px] px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                                    img.isMain ? "bg-red-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                                }`}
                                            >
                                                {img.isMain ? "Ana Resim" : "Ana Yap"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(idx)}
                                                className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                                                title="Resmi Sil"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Manager */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-red-600" />
                                <h3 className="font-bold text-slate-900 text-base">Teknik Özellik Tablosu</h3>
                            </div>
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

                        {features.length === 0 ? (
                            <div className="p-8 text-center border border-slate-200 rounded-xl text-xs text-slate-400">
                                Teknik özellik tanımlanmamış.
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                                {features.map((feat, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <Input
                                            placeholder="Özellik (Örn: Depo Hacmi)"
                                            value={feat.feature}
                                            onChange={(e) => handleUpdateFeature(idx, "feature", e.target.value)}
                                            className="bg-slate-50 text-xs flex-1 border-slate-200"
                                        />
                                        <Input
                                            placeholder="Değer (Örn: 600 cc)"
                                            value={feat.description}
                                            onChange={(e) => handleUpdateFeature(idx, "description", e.target.value)}
                                            className="bg-slate-50 text-xs flex-1 border-slate-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFeature(idx)}
                                            className="text-slate-400 hover:text-red-600 p-1.5 cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTION 4: Grup Ürünleri & Varyant Yönetimi (Bulk Update Table) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-red-600" />
                            Grup Ürünleri & Varyant Etiketleri (Toplu Güncelleme)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Aşağıdaki tabloda her bir ürünün farkını belirten Varyant Etiketini (`10 mm`, `15 mm` vb.), Kodunu, Fiyatını ve Stoğunu topluca güncelleyebilirsiniz.
                        </p>
                    </div>
                    <span className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 self-start sm:self-center">
                        {variants.length} Ürün Grupta
                    </span>
                </div>

                {/* Combobox to Add Product */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Gruba Başka Bir Ürün Dahil Et
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="flex-1">
                            <Combobox
                                options={availableProducts}
                                value={selectedProductId}
                                onChange={setSelectedProductId}
                                placeholder="Eklenecek Ürünü Seçin..."
                                searchPlaceholder="Kod veya ürün adı yazarak arayın..."
                                emptyText="Uygun ürün bulunamadı."
                            />
                        </div>
                        <Button
                            type="button"
                            disabled={!selectedProductId}
                            onClick={handleAddSelectedProduct}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-5"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Gruba Dahil Et
                        </Button>
                    </div>
                </div>

                {/* Variants Bulk Edit Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                            <tr>
                                <th className="p-3.5 w-20">ID / Kod</th>
                                <th className="p-3.5">Ürün İsmi</th>
                                <th className="p-3.5">Varyant Etiketi</th>
                                <th className="p-3.5 w-32">Fiyat</th>
                                <th className="p-3.5 w-28">Stok</th>
                                {individualImages && <th className="p-3.5 w-24 text-center">Resimler</th>}
                                <th className="p-3.5 text-right w-24">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {variants.length === 0 ? (
                                <tr>
                                    <td colSpan={individualImages ? 7 : 6} className="p-8 text-center text-slate-400 italic">
                                        Grupta henüz ürün bulunmuyor. Yukarıdan ürün seçip ekleyebilirsiniz.
                                    </td>
                                </tr>
                            ) : (
                                variants.map((v, idx) => (
                                    <React.Fragment key={v.productId}>
                                        <tr className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-3.5 font-mono text-slate-700 font-medium text-xs">
                                                #{v.productId}<br/><span className="text-slate-400 font-normal">{v.code}</span>
                                            </td>
                                            <td className="p-3.5">
                                                <Input
                                                    type="text"
                                                    value={v.name}
                                                    onChange={(e) => handleUpdateVariant(idx, "name", e.target.value)}
                                                    placeholder="Ürün ismi..."
                                                    className="bg-white text-xs text-slate-900 border-slate-300 focus:ring-2 focus:ring-red-500/20 mb-1"
                                                />
                                            </td>
                                            <td className="p-3.5">
                                                <Input
                                                    type="text"
                                                    value={v.variantLabel}
                                                    onChange={(e) => handleUpdateVariant(idx, "variantLabel", e.target.value)}
                                                    placeholder="Örn: 10 mm"
                                                    className="bg-white text-xs font-semibold text-slate-900 border-slate-300 focus:ring-2 focus:ring-red-500/20"
                                                />
                                            </td>
                                            <td className="p-3.5">
                                                <Input
                                                    type="number"
                                                    value={v.price}
                                                    onChange={(e) => handleUpdateVariant(idx, "price", parseFloat(e.target.value) || 0)}
                                                    className="bg-white text-xs border-slate-300"
                                                />
                                            </td>
                                            <td className="p-3.5">
                                                <Input
                                                    type="number"
                                                    value={v.stock}
                                                    onChange={(e) => handleUpdateVariant(idx, "stock", parseInt(e.target.value, 10) || 0)}
                                                    className="bg-white text-xs border-slate-300"
                                                />
                                            </td>
                                            {individualImages && (
                                                <td className="p-3.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedVariantImages(expandedVariantImages === idx ? null : idx)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                                            expandedVariantImages === idx
                                                                ? "bg-amber-100 text-amber-700 border-amber-300"
                                                                : (v.images && v.images.length > 0)
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                                                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                                        }`}
                                                        title={`${(v.images || []).length} bireysel resim`}
                                                    >
                                                        <ImageIcon className="w-3.5 h-3.5" />
                                                        {(v.images || []).length}
                                                        {expandedVariantImages === idx ? (
                                                            <ChevronUp className="w-3 h-3" />
                                                        ) : (
                                                            <ChevronDown className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                </td>
                                            )}
                                            <td className="p-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/products/${v.productId}`} target="_blank">
                                                        <button
                                                            type="button"
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                                            title="Ürün Detayını Aç"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </button>
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveVariant(v.productId)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                                        title="Gruptan Çıkar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expandable Individual Images Panel */}
                                        {individualImages && expandedVariantImages === idx && (
                                            <tr>
                                                <td colSpan={7} className="p-0">
                                                    <div className="bg-amber-50/50 border-t border-b border-amber-200/60 px-5 py-4 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                                                                <ImageIcon className="w-4 h-4 text-amber-600" />
                                                                {v.variantLabel || v.name || `Ürün #${v.productId}`} — Bireysel Resimler
                                                            </h4>
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedVariantImages(null)}
                                                                className="p-1 text-amber-500 hover:text-amber-700 cursor-pointer"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {/* Upload Button */}
                                                        <div className="flex gap-2">
                                                            <label className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all">
                                                                {isUploadingVariantImage === idx ? (
                                                                    <>
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                        Yükleniyor...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Upload className="w-3.5 h-3.5" />
                                                                        Resim Ekle
                                                                    </>
                                                                )}
                                                                <input
                                                                    type="file"
                                                                    multiple
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => handleVariantFileUpload(e, idx)}
                                                                    disabled={isUploadingVariantImage === idx}
                                                                />
                                                            </label>
                                                        </div>

                                                        {/* Image Grid */}
                                                        {(!v.images || v.images.length === 0) ? (
                                                            <div className="p-4 text-center border border-dashed border-amber-300 rounded-lg bg-amber-50/50">
                                                                <ImageIcon className="w-6 h-6 text-amber-300 mx-auto mb-1" />
                                                                <p className="text-[11px] text-amber-500">Bu ürüne özel resim eklenmemiş.</p>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                                                {v.images.map((img, imgIdx) => (
                                                                    <div
                                                                        key={imgIdx}
                                                                        className={`relative p-1.5 rounded-lg border bg-white flex flex-col items-center gap-1 ${
                                                                            img.isMain ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200"
                                                                        }`}
                                                                    >
                                                                        <div className="w-full aspect-square relative rounded bg-white overflow-hidden border border-slate-100">
                                                                            <Image
                                                                                src={getImageUrl(img.url)}
                                                                                alt={`Bireysel ${imgIdx + 1}`}
                                                                                fill
                                                                                className="object-contain p-0.5"
                                                                                unoptimized
                                                                            />
                                                                        </div>
                                                                        <div className="w-full flex items-center justify-between gap-0.5">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSetVariantMainImage(idx, imgIdx)}
                                                                                className={`text-[9px] px-1.5 py-0.5 rounded font-semibold cursor-pointer ${
                                                                                    img.isMain ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                                                                }`}
                                                                            >
                                                                                {img.isMain ? "Ana" : "Ana Yap"}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveVariantImage(idx, imgIdx)}
                                                                                className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                                                                                title="Sil"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-xs text-slate-500">
                        Kaydettiğinizde tüm ortak detaylar ve listedeki <span className="font-bold text-slate-800">{variants.length}</span> ürün topluca senkronize edilir.
                    </span>

                    <Button
                        type="button"
                        onClick={handleSaveGroupAndSync}
                        disabled={saving}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-md cursor-pointer transition-all w-full sm:w-auto"
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

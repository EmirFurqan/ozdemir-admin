"use client";

import { useActionState, useState, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveProduct } from "@/app/actions/product";
import { Product } from "@/app/services/productService";
import { Plus, Trash2, Upload, Loader2, X, Star, Clipboard, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false }) as any;

export default function ProductForm({ product, brands, categories, initialGroupId, initialVariantLabel }: { product?: Product, brands: any[], categories: any[], initialGroupId?: string, initialVariantLabel?: string }) {
    const [state, formAction] = useActionState(saveProduct, null);
    // If we have an initial group, we assume it's a variant product
    const [hasVariants, setHasVariants] = useState(!!(product?.variants && product.variants.length > 0) || !!product?.groupName || !!initialGroupId);

    // Selection state
    const [selectedBrand, setSelectedBrand] = useState<string>(product?.brand?.id?.toString() || "");
    const [selectedCategory, setSelectedCategory] = useState<string>(product?.category?.id?.toString() || "");

    // Filter categories based on selected brand
    const filteredCategories = selectedBrand
        ? categories.filter(c => !c.brand || c.brand.id.toString() === selectedBrand)
        // If categories don't have brand info, show all? Or usually they do.
        // Assuming strict filtering if relationship exists. 
        // If data might be loose, better to show all if no match found? 
        // Let's assume Categories have a brandId or brand object.
        // Looking at CategoryService, it has `brand: {id, name}`.
        : categories;

    // Features State
    const [features, setFeatures] = useState<{ id?: number, feature: string, description: string, displayOrder: number }[]>(
        product?.features?.map(f => ({
            id: f.id,
            feature: f.feature,
            description: f.description,
            displayOrder: f.displayOrder || 0
        })) || []
    );
    const [showBulkPaste, setShowBulkPaste] = useState(false);
    const [bulkPasteContent, setBulkPasteContent] = useState("");

    const handleBulkPaste = () => {
        if (!bulkPasteContent.trim()) return;

        const lines = bulkPasteContent.trim().split('\n');
        const newFeatures: typeof features = [];
        let currentOrder = features.length;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            // Try to split by tab first (Excel copy)
            let parts = trimmedLine.split('\t');

            // If no tab found, try to split by multiple spaces (common in alignment)
            if (parts.length === 1) {
                parts = trimmedLine.split(/\s{2,}/);
            }

            // If still 1 part and has ':', try split by colon
            if (parts.length === 1 && trimmedLine.includes(':')) {
                parts = trimmedLine.split(':');
            }

            if (parts.length >= 1) {
                const key = parts[0].trim();
                const value = parts.slice(1).join(' ').trim(); // Join rest as value

                if (key) {
                    newFeatures.push({
                        feature: key,
                        description: value,
                        displayOrder: currentOrder++
                    });
                }
            }
        });

        if (newFeatures.length > 0) {
            setFeatures([...features, ...newFeatures]);
            setBulkPasteContent("");
            setShowBulkPaste(false);
        }
    };

    // Description State for Rich Editor
    const [description, setDescription] = useState(product?.description || "");
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

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'font': [] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'align': [] }],
                ['link', 'image', 'video'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    }), [imageHandler]);

    const formats = [
        'header', 'font',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'color', 'background',
        'list', 'indent',
        'align',
        'link', 'image', 'video'
    ];

    // ... (rest of state: variants, images, etc.)
    const [variants, setVariants] = useState<any[]>(
        product?.variants?.filter(v => v.id !== product.id.toString()) || []
    );
    const [newVariants, setNewVariants] = useState<{ label: string, code: string, price: string, stock: string, logoLogicalRef: string }[]>([]);

    // Image State
    const [images, setImages] = useState<{ url: string, isMain: boolean, displayOrder: number }[]>(
        product?.images?.map(img => ({
            url: img.url,
            isMain: img.isMain,
            displayOrder: img.displayOrder
        })) || []
    );
    const [isUploading, setIsUploading] = useState(false);

    const [dimensionWarning, setDimensionWarning] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const files = Array.from(e.target.files);

        // Process sequentially to maintain order
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
                    setImages(prev => {
                        const newImage = {
                            url: data.url,
                            isMain: prev.length === 0, // First image overall is main
                            displayOrder: prev.length
                        };
                        return [...prev, newImage];
                    });
                } else {
                    console.error("Upload failed for file:", file.name);
                }
            } catch (error) {
                console.error("Upload error:", error);
            }
        }
        setIsUploading(false);
        e.target.value = "";
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        if (e.clipboardData.files && e.clipboardData.files.length > 0) {
            e.preventDefault();
            setIsUploading(true);
            const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));

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
                        setImages(prev => {
                            const newImage = {
                                url: data.url,
                                isMain: prev.length === 0,
                                displayOrder: prev.length
                            };
                            return [...prev, newImage];
                        });
                    }
                } catch (error) {
                    console.error("Paste upload error:", error);
                }
            }
            setIsUploading(false);
        }
    };

    const moveImage = (index: number, direction: 'left' | 'right') => {
        if (direction === 'left' && index === 0) return;
        if (direction === 'right' && index === images.length - 1) return;

        const newImages = [...images];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;

        // Swap
        [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];

        // Ensure Main image logic is preserved?
        // Actually, if we swap, the "Main" status moves with the image. 
        // If the user wants to change which one is main, they use the Star button.
        // So simple swap is enough.

        setImages(newImages);
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        // If main image was removed, make the first one main if exists
        if (images[index].isMain && newImages.length > 0) {
            newImages[0].isMain = true;
        }
        setImages(newImages);
    };

    const setMainImage = (index: number) => {
        const newImages = images.map((img, i) => ({
            ...img,
            isMain: i === index
        }));
        setImages(newImages);
        setImages(newImages);
    };

    // Variant Handlers
    const addVariant = () => {
        setNewVariants([...newVariants, { label: "", code: "", price: "", stock: "", logoLogicalRef: "" }]);
    };

    const removeNewVariant = (index: number) => {
        setNewVariants(newVariants.filter((_, i) => i !== index));
    };

    const updateNewVariant = (index: number, field: string, value: string) => {
        const updated = [...newVariants];
        // @ts-ignore
        updated[index][field] = value;
        setNewVariants(updated);
    };

    // Feature Handlers
    const addFeature = () => {
        setFeatures([...features, { feature: "", description: "", displayOrder: features.length }]);
    };

    const removeFeature = (index: number) => {
        const newFeatures = features.filter((_, i) => i !== index);
        setFeatures(newFeatures);
    };

    const updateFeature = (index: number, field: string, value: string) => {
        const updated = [...features];
        // @ts-ignore
        updated[index][field] = value;
        setFeatures(updated);
    };

    const getImageUrl = (url: string) => {
        if (!url) return "/assets/product-placeholder.png";
        if (url.startsWith("http")) return url;
        // Strip /api from the end if present
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";
        return `${baseUrl}${url}`;
    };

    return (
        <form action={formAction} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <input type="hidden" name="id" value={product?.id || "new"} />
            <input type="hidden" name="hasVariants" value={hasVariants ? "true" : "false"} />
            <input type="hidden" name="newVariants" value={JSON.stringify(newVariants)} />
            <input type="hidden" name="uploadedImages" value={JSON.stringify(images)} />
            <input type="hidden" name="features" value={JSON.stringify(features)} />
            <input type="hidden" name="description" value={description} />

            {/* Left Column: Main Info */}
            <div className="lg:col-span-2 space-y-6">

                {/* Basic Info Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Temel Bilgiler</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Marka</label>
                            <select
                                name="brandId"
                                value={selectedBrand}
                                onChange={(e) => {
                                    setSelectedBrand(e.target.value);
                                    setSelectedCategory(""); // Reset category on brand change
                                }}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                required
                            >
                                <option value="">Marka Seçiniz</option>
                                {brands.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Kategori</label>
                            <select
                                name="categoryId"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                required
                            >
                                <option value="">Kategori Seçiniz</option>
                                {filteredCategories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Ürün Adı</label>
                            <Input name="name" defaultValue={product?.name} required placeholder="Örn: Üstten Depo Boya Tabancası" className="bg-slate-50" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Ürün Kodu {hasVariants && "(Ana)"}</label>
                            <Input name="code" defaultValue={product?.code} required placeholder="Örn: 810077" className="bg-slate-50" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Açıklama</label>
                        <div className="bg-slate-50 rounded-md border border-slate-200">
                            <ReactQuill
                                theme="snow"
                                value={description}
                                onChange={setDescription}
                                modules={modules}
                                formats={formats}
                                ref={quillRef}
                                className="h-[400px] mb-12"
                            />
                        </div>
                    </div>

                    {/* Features Table */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-900">Ürün Özellikleri</h4>
                            <div className="flex gap-2">
                                <Button type="button" onClick={() => setShowBulkPaste(!showBulkPaste)} size="sm" variant="secondary" className="h-8">
                                    <Clipboard className="w-3 h-3 mr-1" /> Toplu Ekle
                                </Button>
                                <Button type="button" onClick={addFeature} size="sm" variant="outline" className="h-8">
                                    <Plus className="w-3 h-3 mr-1" /> Özellik Ekle
                                </Button>
                            </div>
                        </div>

                        {showBulkPaste && (
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                                <p className="text-xs text-slate-500">
                                    Excel'den veya başka bir tablodan kopyaladığınız verileri buraya yapıştırın.
                                    <br />
                                    Format: <strong>Özellik [TAB] Değer</strong> (Her satıra bir özellik)
                                </p>
                                <textarea
                                    value={bulkPasteContent}
                                    onChange={(e) => setBulkPasteContent(e.target.value)}
                                    placeholder={`Örnek:\nMarka\tAristo\nÜrün Kodu\t8380xx\nAğırlık\t890 gr.`}
                                    className="w-full h-32 p-3 text-xs font-mono border border-slate-300 rounded focus:ring-2 focus:ring-slate-950 focus:outline-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowBulkPaste(false)}>Vazgeç</Button>
                                    <Button type="button" size="sm" onClick={handleBulkPaste}>Ekle</Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {features.map((f, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Özellik (örn. Ağırlık)"
                                        value={f.feature}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFeature(i, 'feature', e.target.value)}
                                        className="h-9 bg-slate-50"
                                    />
                                    <Input
                                        placeholder="Değer (örn. 500gr)"
                                        value={f.description}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFeature(i, 'description', e.target.value)}
                                        className="h-9 bg-slate-50"
                                    />
                                    <Button type="button" onClick={() => removeFeature(i)} size="icon" variant="ghost" className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {features.length === 0 && (
                                <p className="text-xs text-slate-500 italic text-center py-4 bg-slate-50 rounded border border-dashed border-slate-200">
                                    Henüz özellik eklenmedi.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pricing & Stock Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Fiyat ve Stok</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Fiyat</label>
                            <Input name="price" type="number" step="0.01" defaultValue={product?.price} required className="bg-slate-50" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Para Birimi</label>
                            <select name="currency" defaultValue={product?.currency || 160} className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950">
                                <option value="160">TL (₺)</option>
                                <option value="1">USD ($)</option>
                                <option value="20">EUR (€)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">KDV Oranı (%)</label>
                            <Input name="vatRate" type="number" step="1" defaultValue={product?.vatRate || 20} className="bg-slate-50" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Stok Adedi</label>
                            <Input name="stock" type="number" defaultValue={product?.stock || 0} className="bg-slate-50" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Logo Logical Ref (ERP)</label>
                            <Input name="logoLogicalRef" type="number" defaultValue={product?.logoLogicalRef || ""} placeholder="Logo ERP Referans No" className="bg-slate-50" />
                            <p className="text-[10px] text-slate-500">Logo entegrasyonu için referans numarası.</p>
                        </div>
                    </div>
                </div>

                {/* Variants Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-lg font-semibold text-slate-900">Varyasyonlar</h3>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="hasVariants"
                                checked={hasVariants}
                                onChange={(e) => setHasVariants(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-600"
                            />
                            <label htmlFor="hasVariants" className="text-sm font-medium text-slate-700 cursor-pointer">Varyasyonlu Ürün</label>
                        </div>
                    </div>

                    {hasVariants ? (
                        <div className="space-y-6 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Grup Kodu / Adı</label>
                                    {/* If initialGroupId is passed, we might want to use that. But groupCode input expects a string (Name/Code) 
                                        Wait, backend expects groupName matching? Or code?
                                        Actually, ProductForm as it stands allows entering a "groupCode" string.
                                        But from Group Manager, we have an ID.
                                        If we pass ID, we should probably add a hidden input "existingGroupId" like in EditForm?
                                        The current ProductForm assumes creating variants by string matching ("Group Code / Name").
                                        But the saveProduct action logic for "existingGroupId" (Step 83) was for EDIT.
                                        We should add existingGroupId to CREATE form too if we want to support direct assignment by ID.
                                    */}
                                    <Input name="groupCode" defaultValue={product?.groupName || ""} placeholder="Örn: GROUP-8100" required={hasVariants && !initialGroupId} className="bg-slate-50" />
                                    {initialGroupId && <input type="hidden" name="existingGroupId" value={initialGroupId} />}
                                    <p className="text-xs text-slate-500">
                                        {initialGroupId ? "Seçili gruba eklenecek." : "Aynı gruba ait ürünler birleştirilir."}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Ana Ürün Etiketi ({product?.code})</label>
                                    <Input name="mainVariantLabel" defaultValue={product?.variantLabel || initialVariantLabel || "Standart"} placeholder="Örn: 1.3mm" className="bg-slate-50" />
                                </div>
                            </div>

                            {/* Existing Variants Display */}
                            {variants.length > 0 && (
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-bold mb-3 text-slate-700">Mevcut Varyasyonlar</h4>
                                    <div className="flex flex-col gap-2">
                                        {variants.map((v: any) => (
                                            <div key={v.id} className="flex justify-between items-center bg-white p-3 rounded border border-slate-200 shadow-sm text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{v.code}</span>
                                                    <span className="text-slate-500">{v.label}</span>
                                                </div>
                                                <span className="font-mono bg-slate-100 px-2 py-1 rounded">{v.stock} Adet</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Variants Generator */}
                            <div className="bg-red-50/50 p-4 rounded-lg border border-red-100">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-bold text-red-800">Yeni Varyasyon Ekle</h4>
                                    <Button type="button" onClick={addVariant} size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                                        <Plus className="w-3 h-3 mr-1" /> Ekle
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {newVariants.map((v, i) => (
                                        <div key={i} className="flex gap-2 items-start p-2 bg-white rounded border border-red-100 shadow-sm">
                                            <div className="grid grid-cols-5 gap-2 w-full">
                                                <Input placeholder="Kod" value={v.code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNewVariant(i, 'code', e.target.value)} className="h-8 text-xs" />
                                                <Input placeholder="Etiket (1.5mm)" value={v.label} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNewVariant(i, 'label', e.target.value)} className="h-8 text-xs" />
                                                <Input placeholder="Fiyat" type="number" value={v.price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNewVariant(i, 'price', e.target.value)} className="h-8 text-xs" />
                                                <Input placeholder="Stok" type="number" value={v.stock} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNewVariant(i, 'stock', e.target.value)} className="h-8 text-xs" />
                                                <Input placeholder="Logo Ref" type="number" value={v.logoLogicalRef} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNewVariant(i, 'logoLogicalRef', e.target.value)} className="h-8 text-xs" />
                                            </div>
                                            <Button type="button" onClick={() => removeNewVariant(i)} size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {newVariants.length === 0 && (
                                        <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded">
                                            Yeni varyasyon eklemek için "Ekle" butonuna basın.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic py-2">Bu ürün tek tiptir, varyasyonu yoktur.</p>
                    )}
                </div>
            </div>

            {/* Right Column: Media & Actions */}
            <div className="space-y-6">

                {/* Media Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Ürün Görselleri</h3>

                    <div className="grid grid-cols-2 gap-4">
                        {images.map((img, index) => (
                            <div key={index} className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${img.isMain ? 'border-red-500' : 'border-slate-200'}`}>
                                <Image
                                    src={getImageUrl(img.url)}
                                    fill
                                    alt="Product"
                                    className="object-cover"
                                />
                                {img.isMain && (
                                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow">
                                        KAPAK
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-[1px]">
                                    <button
                                        type="button"
                                        onClick={() => moveImage(index, 'left')}
                                        disabled={index === 0}
                                        className="bg-white/90 p-1.5 rounded-full hover:bg-white text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Sola Taşı"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>

                                    {!img.isMain && (
                                        <button
                                            type="button"
                                            onClick={() => setMainImage(index)}
                                            className="bg-white/90 p-1.5 rounded-full hover:bg-white text-yellow-500"
                                            title="Kapak Yap"
                                        >
                                            <Star className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="bg-red-500/90 p-1.5 rounded-full hover:bg-red-600 text-white"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => moveImage(index, 'right')}
                                        disabled={index === images.length - 1}
                                        className="bg-white/90 p-1.5 rounded-full hover:bg-white text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Sağa Taşı"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4">
                        <label
                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                            onPaste={handlePaste}
                            tabIndex={0}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {isUploading ? (
                                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-2" />
                                ) : (
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                )}
                                <p className="text-xs text-slate-500 font-medium">
                                    Resim Yükle veya <span className="text-red-600">Yapıştır (Ctrl+V)</span>
                                </p>
                                <p className="text-[10px] text-slate-400">Çoklu seçim yapılabilir</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} disabled={isUploading} />
                        </label>

                        {dimensionWarning && (
                            <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                                <strong className="block mb-1">Boyut Uyarısı</strong>
                                Yüklenen son görsel kare (1:1) formatında değil.
                                Ürünlerin düzgün görünmesi için lütfen <b>1000x1000px</b> boyutlarında görsel yükleyiniz.
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Actions */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 sticky top-6">
                    <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Kaydet</h3>

                    {state?.message && (
                        <div className="p-3 bg-red-100 text-red-600 rounded text-sm border border-red-200">
                            {state.message}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg shadow-md transition-all hover:scale-[1.02]">
                            {product?.id ? "Güncelle" : "Kaydet"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => window.history.back()} className="w-full">
                            Vazgeç
                        </Button>
                    </div>
                </div>

            </div>
        </form>
    );
}

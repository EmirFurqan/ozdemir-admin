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
import { fetchGroupTierDiscountsAction, saveGroupTierDiscountsAction } from "@/app/actions/tierDiscountActions";
import TableImage from "@/app/components/TableImage";
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
    X,
    CheckSquare,
    Percent,
    Tag
} from "lucide-react";
import "react-quill-new/dist/quill.snow.css";
import ProductSelectModal from "./ProductSelectModal";
import ProductImageFinderModal from "@/app/components/ProductImageFinderModal";

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
    currency?: string;
    currencyId?: number;
    stock: number;
    active?: boolean;
    images?: GroupImage[];
    features?: GroupFeature[];
}

export default function ProductGroupEditor({
    group,
    groupId = 0,
    products = [],
    allProducts = [],
    brands = [],
    categories = [],
}: {
    group?: any;
    groupId?: number;
    products?: any[];
    allProducts?: any[];
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

    // Tier Discounts (S, A, B, P) - 3'lü Kademeli İskonto Desteği
    const [tierDiscounts, setTierDiscounts] = useState<{ S: number; A: number; B: number; P: number }>({
        S: 0,
        A: 0,
        B: 0,
        P: 0
    });
    const [tierDiscounts2, setTierDiscounts2] = useState<{ S: number; A: number; B: number; P: number }>({
        S: 0,
        A: 0,
        B: 0,
        P: 0
    });
    const [tierDiscounts3, setTierDiscounts3] = useState<{ S: number; A: number; B: number; P: number }>({
        S: 0,
        A: 0,
        B: 0,
        P: 0
    });

    // Shared assets
    const [images, setImages] = useState<GroupImage[]>([]);
    const [features, setFeatures] = useState<GroupFeature[]>([]);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isSharedImageFinderOpen, setIsSharedImageFinderOpen] = useState(false);

    // Individual images mode
    const [individualImages, setIndividualImages] = useState(false);
    const [expandedVariantImages, setExpandedVariantImages] = useState<number | null>(null);
    const [isUploadingVariantImage, setIsUploadingVariantImage] = useState<number | null>(null);
    const [variantImageFinderTarget, setVariantImageFinderTarget] = useState<{ index: number; product: VariantProduct } | null>(null);

    // Individual features mode
    const [individualFeatures, setIndividualFeatures] = useState(false);
    const [expandedVariantFeatures, setExpandedVariantFeatures] = useState<number | null>(null);

    // Product variants
    const [variants, setVariants] = useState<VariantProduct[]>([]);
    const [variantSearch, setVariantSearch] = useState("");
    const [variantPage, setVariantPage] = useState(0);
    const variantPageSize = 10;

    const filteredVariants = useMemo(() => {
        if (!variantSearch.trim()) return variants;
        const q = variantSearch.toLowerCase().trim();
        return variants.filter((v) =>
            (v.code && v.code.toLowerCase().includes(q)) ||
            (v.name && v.name.toLowerCase().includes(q)) ||
            (v.variantLabel && v.variantLabel.toLowerCase().includes(q)) ||
            (v.productId && v.productId.toString().includes(q))
        );
    }, [variants, variantSearch]);

    const totalVariantPages = Math.ceil(filteredVariants.length / variantPageSize);
    const paginatedVariants = useMemo(() => {
        const start = variantPage * variantPageSize;
        return filteredVariants.slice(start, start + variantPageSize);
    }, [filteredVariants, variantPage, variantPageSize]);

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

            const isIndividualFeats = group?.individualFeatures === true;
            if (isIndividualFeats) {
                setIndividualFeatures(true);
            }

            setVariants(
                products.map((p) => ({
                    productId: p.id,
                    name: p.name || "",
                    variantLabel: p.variantLabel || "",
                    code: p.code || "",
                    price: p.price || 0,
                    currency: p.currency || (p.currencyId === 1 ? "$" : p.currencyId === 20 ? "€" : "₺"),
                    currencyId: p.currencyId ?? (p.currency === "$" ? 1 : p.currency === "€" ? 20 : 160),
                    stock: p.stock || 0,
                    active: p.active !== false,
                    images: p.images && p.images.length > 0
                        ? p.images.map((img: any) => ({
                            url: img.url,
                            isMain: img.isMain,
                            displayOrder: img.displayOrder || 0,
                        }))
                        : p.imageUrl ? [{ url: p.imageUrl, isMain: true, displayOrder: 0 }] : [],
                    features: p.features && p.features.length > 0
                        ? p.features.map((f: any) => ({
                            feature: f.feature,
                            description: f.description,
                            displayOrder: f.displayOrder || 0,
                        }))
                        : [],
                }))
            );

            // Populate shared images: Prioritize all shared images from products[0] if shared mode
            if (!isIndividualMode && products[0]?.images && products[0].images.length > 0) {
                setImages(
                    products[0].images.map((img: any) => ({
                        url: img.url,
                        isMain: img.isMain,
                        displayOrder: img.displayOrder || 0,
                    }))
                );
            } else if (group?.imageUrl) {
                setImages([{ url: group.imageUrl, isMain: true, displayOrder: 0 }]);
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
    const [isLoadingSelectProducts, setIsLoadingSelectProducts] = useState(false);
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

    useEffect(() => {
        if (!selectProducts || selectProducts.length === 0) {
            setIsLoadingSelectProducts(true);
            getProductsForSelect()
                .then((data) => {
                    setSelectProducts(data || []);
                })
                .finally(() => {
                    setIsLoadingSelectProducts(false);
                });
        }
    }, []);

    // Load Tier Discounts for this group
    useEffect(() => {
        if (groupId && groupId > 0) {
            fetchGroupTierDiscountsAction(groupId)
                .then((discounts) => {
                    if (Array.isArray(discounts) && discounts.length > 0) {
                        const map1: any = { S: 0, A: 0, B: 0, P: 0 };
                        const map2: any = { S: 0, A: 0, B: 0, P: 0 };
                        const map3: any = { S: 0, A: 0, B: 0, P: 0 };
                        discounts.forEach((d: any) => {
                            const t = d.tier ? d.tier.toUpperCase() : "";
                            if (t && map1[t] !== undefined) {
                                map1[t] = Number(d.discountPercent || 0);
                                map2[t] = Number(d.discountPercent2 || 0);
                                map3[t] = Number(d.discountPercent3 || 0);
                            }
                        });
                        setTierDiscounts(map1);
                        setTierDiscounts2(map2);
                        setTierDiscounts3(map3);
                    }
                })
                .catch((err) => console.error("Tier discounts loading error:", err));
        }
    }, [groupId]);

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
                currency: prod.currency || (prod.currencyId === 1 ? "$" : prod.currencyId === 20 ? "€" : "₺"),
                currencyId: prod.currencyId ?? (prod.currency === "$" ? 1 : prod.currency === "€" ? 20 : 160),
                stock: prod.stock || 0,
                active: prod.active !== false,
                images: prod.images && prod.images.length > 0
                    ? prod.images.map((img: any) => ({
                        url: img.url,
                        isMain: img.isMain,
                        displayOrder: img.displayOrder || 0,
                    }))
                    : prod.imageUrl ? [{ url: prod.imageUrl, isMain: true, displayOrder: 0 }] : [],
                features: prod.features && prod.features.length > 0
                    ? prod.features.map((f: any) => ({
                        feature: f.feature,
                        description: f.description,
                        displayOrder: f.displayOrder || 0,
                    }))
                    : [],
            },
        ]);
        setSelectedProductId("");
    };

    const handleApplyModalSelection = (selectedIds: number[], selectedProductObjects: any[]) => {
        const existingVariantMap = new Map<number, VariantProduct>();
        variants.forEach((v) => existingVariantMap.set(v.productId, v));

        const newVariants: VariantProduct[] = selectedIds.map((id) => {
            if (existingVariantMap.has(id)) {
                return existingVariantMap.get(id)!;
            }

            const prod = selectedProductObjects.find((p) => (p.productId || p.id) === id) || selectProducts.find((p) => (p.productId || p.id) === id);
            return {
                productId: id,
                name: prod?.name || "",
                variantLabel: prod?.variantLabel || "",
                code: prod?.code || "",
                price: prod?.price || 0,
                currency: prod?.currency || (prod?.currencyId === 1 ? "$" : prod?.currencyId === 20 ? "€" : "₺"),
                currencyId: prod?.currencyId ?? (prod?.currency === "$" ? 1 : prod?.currency === "€" ? 20 : 160),
                stock: prod?.stock || 0,
                active: prod?.active !== false,
                images: prod?.images && prod.images.length > 0
                    ? prod.images.map((img: any) => ({
                        url: img.url,
                        isMain: img.isMain,
                        displayOrder: img.displayOrder || 0,
                    }))
                    : prod?.imageUrl ? [{ url: prod.imageUrl, isMain: true, displayOrder: 0 }] : [],
                features: prod?.features && prod.features.length > 0
                    ? prod.features.map((f: any) => ({
                        feature: f.feature,
                        description: f.description,
                        displayOrder: f.displayOrder || 0,
                    }))
                    : [],
            };
        });

        setVariants(newVariants);
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

    // Variant Features logic
    const handleAddVariantFeature = (variantIndex: number) => {
        setVariants((prev) => {
            const updated = [...prev];
            const feats = [...(updated[variantIndex].features || [])];
            feats.push({ feature: "", description: "", displayOrder: feats.length });
            updated[variantIndex] = { ...updated[variantIndex], features: feats };
            return updated;
        });
    };

    const handleUpdateVariantFeature = (variantIndex: number, featIndex: number, key: "feature" | "description", val: string) => {
        setVariants((prev) => {
            const updated = [...prev];
            const feats = [...(updated[variantIndex].features || [])];
            feats[featIndex] = { ...feats[featIndex], [key]: val };
            updated[variantIndex] = { ...updated[variantIndex], features: feats };
            return updated;
        });
    };

    const handleRemoveVariantFeature = (variantIndex: number, featIndex: number) => {
        setVariants((prev) => {
            const updated = [...prev];
            const feats = [...(updated[variantIndex].features || [])];
            feats.splice(featIndex, 1);
            feats.forEach((f, i) => (f.displayOrder = i));
            updated[variantIndex] = { ...updated[variantIndex], features: feats };
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
                groupId: groupId > 0 ? groupId : null,
                groupCode: groupCode.trim(),
                groupName: groupName.trim() || groupCode.trim(),
                brandId: brandId ? parseInt(brandId, 10) : null,
                categoryId: categoryId ? parseInt(categoryId, 10) : null,
                description: groupDescription,
                images,
                features,
                individualImages,
                individualFeatures,
                products: variants.map((v) => ({
                    ...v,
                    currencyId: v.currencyId ?? (v.currency === "$" ? 1 : v.currency === "€" ? 20 : 160),
                    currency: v.currency || (v.currencyId === 1 ? "$" : v.currencyId === 20 ? "€" : "₺"),
                    images: individualImages ? (v.images || []) : (v.images && v.images.length > 0 ? v.images : undefined),
                    features: individualFeatures ? (v.features || []) : (v.features && v.features.length > 0 ? v.features : undefined),
                })),
            };

            const res = await bulkAssignGroupAction(payload);
            if (res.success) {
                const targetGroupId = groupId > 0 ? groupId : res.group?.id;
                if (targetGroupId) {
                    try {
                        await saveGroupTierDiscountsAction(targetGroupId, tierDiscounts, tierDiscounts2, tierDiscounts3, true);
                    } catch (err) {
                        console.error("Tier discounts save warning:", err);
                    }
                }

                setStatusMessage({
                    type: "success",
                    text: groupId > 0 ? "Tüm grup ortak detayları, iskontolar ve alt ürünler başarıyla güncellendi!" : "Yeni ürün grubu ve iskontolar başarıyla oluşturuldu!",
                });
                if ((!groupId || groupId === 0) && res.group?.id) {
                    router.push(`/product-groups/${res.group.id}`);
                }
            } else {
                setStatusMessage({ type: "error", text: res.message || "Grup kaydedilirken hata oluştu." });
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
                                {groupId > 0 ? (groupCode || "Grup Düzenleme") : "Yeni Grup"}
                            </span>
                            {groupId > 0 && <span className="text-xs text-slate-400">ID: #{groupId}</span>}
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mt-1">
                            {groupId > 0 ? (groupName || "Ürün Grubu Düzenle") : (groupName || "Yeni Ürün Grubu Oluştur")}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {groupId > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDeleteGroup}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-sm px-4 py-3 rounded-xl transition-all cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Grubu Sil
                        </Button>
                    )}
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

                        {/* File Upload + Text URL Input + Web Finder */}
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

                            <Button
                                type="button"
                                onClick={() => setIsSharedImageFinderOpen(true)}
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs px-3.5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Web&apos;den Resim Bul
                            </Button>

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
                            <div className="flex items-center gap-3">
                                {/* Individual Features Toggle */}
                                <button
                                    type="button"
                                    onClick={() => setIndividualFeatures(!individualFeatures)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                        individualFeatures
                                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                    }`}
                                    title={individualFeatures ? "Bireysel özellikler aktif — her ürünün kendi teknik özellikleri olabilir" : "Tüm ürünler aynı özellikleri paylaşır"}
                                >
                                    {individualFeatures ? (
                                        <ToggleRight className="w-4 h-4 text-amber-600" />
                                    ) : (
                                        <ToggleLeft className="w-4 h-4" />
                                    )}
                                    {individualFeatures ? "Bireysel Özellikler Aktif" : "Bireysel Özellikler"}
                                </button>
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
                        </div>
                        {individualFeatures && (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    <strong>Bireysel teknik özellik modu aktif.</strong> Aşağıdaki ortak teknik özellikler varsayılan olarak gruba tanımlanır. Ek olarak, aşağıdaki ürün tablosunda her ürüne özel teknik özellik ekleyip düzenleyebilirsiniz.
                                </p>
                            </div>
                        )}

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

            {/* SECTION 4: Müşteri Grubu İskonto Oranları (S, A, B, P) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <Percent className="w-5 h-5 text-amber-600" />
                        <div>
                            <h3 className="font-bold text-slate-900 text-base">
                                4. Müşteri Grubu İskonto Oranları (S, A, B, P)
                            </h3>
                        </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                        Bayi Portalı İskonto Matrisi
                    </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                    Bu ürün grubuna dahil olan tüm ürünler için müşteri grubu bazlı <strong>3 kademeliye kadar iskonto oranlarını (örn: 40 + 5)</strong> belirleyin.
                    Kaydettiğinizde gruptaki tüm alt varyantlara otomatik yansıtılır ve bayiler sepetlerinde bu oranlara göre net fiyatları görür.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {/* S Grubu */}
                    {(() => {
                        const s1 = tierDiscounts.S || 0;
                        const s2 = tierDiscounts2.S || 0;
                        const s3 = tierDiscounts3.S || 0;
                        const eff = (1 - ((100 - s1) / 100) * ((100 - s2) / 100) * ((100 - s3) / 100)) * 100;
                        const formula = [s1, s2, s3].filter(v => v > 0).join(" + ");

                        return (
                            <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/60 space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-amber-950 flex items-center gap-1">⭐ S Grubu Bayi</span>
                                    <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200 shadow-2xs">En Avantajlı</span>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Kademeli İskontolar (%)</div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">1. İskonto</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={tierDiscounts.S !== undefined && tierDiscounts.S !== 0 ? tierDiscounts.S : ""}
                                                onChange={(e) => setTierDiscounts(prev => ({ ...prev, S: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs font-black text-amber-950 focus:ring-2 focus:ring-amber-400 text-center"
                                                placeholder="40"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">2. İskonto</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={tierDiscounts2.S !== undefined && tierDiscounts2.S !== 0 ? tierDiscounts2.S : ""}
                                                onChange={(e) => setTierDiscounts2(prev => ({ ...prev, S: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs font-bold text-amber-950 focus:ring-2 focus:ring-amber-400 text-center"
                                                placeholder="5"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">3. İskonto</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={tierDiscounts3.S !== undefined && tierDiscounts3.S !== 0 ? tierDiscounts3.S : ""}
                                                onChange={(e) => setTierDiscounts3(prev => ({ ...prev, S: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs font-bold text-amber-950 focus:ring-2 focus:ring-amber-400 text-center"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-1.5 border-t border-amber-200/80 flex items-center justify-between text-[11px]">
                                    <span className="text-amber-800 font-medium">Uygulanan:</span>
                                    <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                        {formula ? `-%${formula} (%${eff.toFixed(2)})` : "%0"}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* A Grubu */}
                    {(() => {
                        const a1 = tierDiscounts.A || 0;
                        const a2 = tierDiscounts2.A || 0;
                        const a3 = tierDiscounts3.A || 0;
                        const eff = (1 - ((100 - a1) / 100) * ((100 - a2) / 100) * ((100 - a3) / 100)) * 100;
                        const formula = [a1, a2, a3].filter(v => v > 0).join(" + ");

                        return (
                            <div className="p-4 rounded-2xl border border-blue-300 bg-blue-50/60 space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-blue-950 flex items-center gap-1">💎 A Grubu Bayi</span>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Kademeli İskontolar (%)</div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">1. İskonto</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={tierDiscounts.A !== undefined && tierDiscounts.A !== 0 ? tierDiscounts.A : ""}
                                                onChange={(e) => setTierDiscounts(prev => ({ ...prev, A: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1.5 text-xs font-black text-blue-950 focus:ring-2 focus:ring-blue-400 text-center"
                                                placeholder="35"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">2. İskonto</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={tierDiscounts2.A !== undefined && tierDiscounts2.A !== 0 ? tierDiscounts2.A : ""}
                                                onChange={(e) => setTierDiscounts2(prev => ({ ...prev, A: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1.5 text-xs font-bold text-blue-950 focus:ring-2 focus:ring-blue-400 text-center"
                                                placeholder="5"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">3. İskonto</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={tierDiscounts3.A !== undefined && tierDiscounts3.A !== 0 ? tierDiscounts3.A : ""}
                                                onChange={(e) => setTierDiscounts3(prev => ({ ...prev, A: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-white border border-blue-300 rounded-lg px-2 py-1.5 text-xs font-bold text-blue-950 focus:ring-2 focus:ring-blue-400 text-center"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-1.5 border-t border-blue-200/80 flex items-center justify-between text-[11px]">
                                    <span className="text-blue-800 font-medium">Uygulanan:</span>
                                    <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                        {formula ? `-%${formula} (%${eff.toFixed(2)})` : "%0"}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* B Grubu */}
                    {(() => {
                        const b1 = tierDiscounts.B || 0;
                        const b2 = tierDiscounts2.B || 0;
                        const b3 = tierDiscounts3.B || 0;
                        const eff = (1 - ((100 - b1) / 100) * ((100 - b2) / 100) * ((100 - b3) / 100)) * 100;
                        const formula = [b1, b2, b3].filter(v => v > 0).join(" + ");

                        return (
                            <div className="p-4 rounded-2xl border border-indigo-300 bg-indigo-50/60 space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1">🔷 B Grubu Bayi</span>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Kademeli İskontolar (%)</div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">1. İskonto</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={tierDiscounts.B !== undefined && tierDiscounts.B !== 0 ? tierDiscounts.B : ""}
                                                onChange={(e) => setTierDiscounts(prev => ({ ...prev, B: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-white border border-indigo-300 rounded-lg px-2 py-1.5 text-xs font-black text-indigo-950 focus:ring-2 focus:ring-indigo-400 text-center"
                                                placeholder="30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">2. İskonto</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={tierDiscounts2.B !== undefined && tierDiscounts2.B !== 0 ? tierDiscounts2.B : ""}
                                                onChange={(e) => setTierDiscounts2(prev => ({ ...prev, B: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-white border border-indigo-300 rounded-lg px-2 py-1.5 text-xs font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-400 text-center"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">3. İskonto</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={tierDiscounts3.B !== undefined && tierDiscounts3.B !== 0 ? tierDiscounts3.B : ""}
                                                onChange={(e) => setTierDiscounts3(prev => ({ ...prev, B: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-white border border-indigo-300 rounded-lg px-2 py-1.5 text-xs font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-400 text-center"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-1.5 border-t border-indigo-200/80 flex items-center justify-between text-[11px]">
                                    <span className="text-indigo-800 font-medium">Uygulanan:</span>
                                    <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                        {formula ? `-%${formula} (%${eff.toFixed(2)})` : "%0"}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* P Grubu */}
                    {(() => {
                        const p1 = tierDiscounts.P || 0;
                        const p2 = tierDiscounts2.P || 0;
                        const p3 = tierDiscounts3.P || 0;
                        const eff = (1 - ((100 - p1) / 100) * ((100 - p2) / 100) * ((100 - p3) / 100)) * 100;
                        const formula = [p1, p2, p3].filter(v => v > 0).join(" + ");

                        return (
                            <div className="p-4 rounded-2xl border border-purple-300 bg-purple-50/60 space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-purple-950 flex items-center gap-1">🔶 P Grubu Bayi</span>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold text-purple-900 uppercase tracking-wider">Kademeli İskontolar (%)</div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">1. İskonto</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={tierDiscounts.P !== undefined && tierDiscounts.P !== 0 ? tierDiscounts.P : ""}
                                                onChange={(e) => setTierDiscounts(prev => ({ ...prev, P: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-white border border-purple-300 rounded-lg px-2 py-1.5 text-xs font-black text-purple-950 focus:ring-2 focus:ring-purple-400 text-center"
                                                placeholder="20"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">2. İskonto</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={tierDiscounts2.P !== undefined && tierDiscounts2.P !== 0 ? tierDiscounts2.P : ""}
                                                onChange={(e) => setTierDiscounts2(prev => ({ ...prev, P: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-white border border-purple-300 rounded-lg px-2 py-1.5 text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-400 text-center"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">3. İskonto</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={tierDiscounts3.P !== undefined && tierDiscounts3.P !== 0 ? tierDiscounts3.P : ""}
                                                onChange={(e) => setTierDiscounts3(prev => ({ ...prev, P: parseFloat(e.target.value) || 0 }))}
                                                className="w-full bg-white border border-purple-300 rounded-lg px-2 py-1.5 text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-400 text-center"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-1.5 border-t border-purple-200/80 flex items-center justify-between text-[11px]">
                                    <span className="text-purple-800 font-medium">Uygulanan:</span>
                                    <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                        {formula ? `-%${formula} (%${eff.toFixed(2)})` : "%0"}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* SECTION 5: Grup Ürünleri & Varyant Yönetimi (Bulk Update Table) */}
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

                {/* Product Selection Controls: Modal Trigger + Fast Combobox */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckSquare className="w-4 h-4 text-red-600" />
                                Gruba Ürün Ekleme & Seçim
                            </span>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Tablodan arama yaparak çoklu ürün seçebilir veya hızlı seçim kutusunu kullanabilirsiniz.
                            </p>
                        </div>

                        <Button
                            type="button"
                            onClick={() => setIsSelectModalOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <CheckSquare className="w-4 h-4" />
                            Tablodan Ürün Seçimi Yap ({variants.length} Seçili)
                        </Button>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="flex-1">
                            <Combobox
                                options={availableProducts}
                                value={selectedProductId}
                                onChange={setSelectedProductId}
                                placeholder="Hızlı Tekli Ürün Seç..."
                                searchPlaceholder="Kod veya ürün adı yazarak arayın..."
                                emptyText="Uygun ürün bulunamadı."
                            />
                        </div>
                        <Button
                            type="button"
                            disabled={!selectedProductId}
                            onClick={handleAddSelectedProduct}
                            variant="outline"
                            className="bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold px-5 h-10 rounded-xl border-slate-300 cursor-pointer"
                        >
                            <Plus className="w-4 h-4 mr-1 text-red-600" /> Hızlı Ekle
                        </Button>
                    </div>
                </div>

                {/* Variants Bulk Edit Table */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="w-full sm:w-72">
                            <Input
                                type="text"
                                placeholder="Grup ürünlerinde ara (kod, ad, etiket)..."
                                value={variantSearch}
                                onChange={(e) => {
                                    setVariantSearch(e.target.value);
                                    setVariantPage(0);
                                }}
                                className="bg-white text-xs border-slate-300"
                            />
                        </div>
                        {totalVariantPages > 1 && (
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                <button
                                    type="button"
                                    disabled={variantPage === 0}
                                    onClick={() => setVariantPage((p) => Math.max(0, p - 1))}
                                    className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span>Sayfa {variantPage + 1} / {totalVariantPages}</span>
                                <button
                                    type="button"
                                    disabled={variantPage >= totalVariantPages - 1}
                                    onClick={() => setVariantPage((p) => Math.min(totalVariantPages - 1, p + 1))}
                                    className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                                <tr>
                                    <th className="p-3.5 w-16">ID</th>
                                    <th className="p-3.5 w-20">Resim</th>
                                    <th className="p-3.5 w-36">Ürün Kodu</th>
                                    <th className="p-3.5">Ürün İsmi</th>
                                    <th className="p-3.5">Varyant Etiketi</th>
                                    <th className="p-3.5 w-28">Fiyat</th>
                                    <th className="p-3.5 w-24">Stok</th>
                                    <th className="p-3.5 w-20 text-center">Durum</th>
                                    {individualImages && <th className="p-3.5 w-24 text-center">Resimler</th>}
                                    {individualFeatures && <th className="p-3.5 w-28 text-center">Özellikler</th>}
                                    <th className="p-3.5 text-right w-20">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {paginatedVariants.length === 0 ? (
                                    <tr>
                                        <td colSpan={9 + (individualImages ? 1 : 0) + (individualFeatures ? 1 : 0)} className="p-8 text-center text-slate-400 italic">
                                            {variantSearch ? "Aramanıza uygun ürün bulunamadı." : "Grupta henüz ürün bulunmuyor. Yukarıdan ürün seçip ekleyebilirsiniz."}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedVariants.map((v, pageIdx) => {
                                        const idx = variantPage * variantPageSize + pageIdx;
                                        const variantImg = v.images?.[0]?.url || images?.[0]?.url || group?.imageUrl;
                                        return (
                                            <React.Fragment key={v.productId}>
                                                <tr className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-3.5 font-mono text-slate-500 font-bold text-xs">
                                                        #{v.productId}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <TableImage
                                                            src={variantImg}
                                                            alt={v.name || v.code}
                                                        />
                                                    </td>
                                                    <td className="p-3.5">
                                                        <Input
                                                            type="text"
                                                            value={v.code}
                                                            onChange={(e) => handleUpdateVariant(idx, "code", e.target.value)}
                                                            placeholder="Ürün kodu..."
                                                            className="bg-white font-mono text-xs text-slate-900 border-slate-300 focus:ring-2 focus:ring-red-500/20"
                                                        />
                                                    </td>
                                                    <td className="p-3.5">
                                                         <Input
                                                             type="text"
                                                             value={v.name}
                                                             onChange={(e) => handleUpdateVariant(idx, "name", e.target.value)}
                                                             placeholder="Ürün ismi..."
                                                             className="bg-white text-xs text-slate-900 border-slate-300 focus:ring-2 focus:ring-red-500/20"
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
                                                          <div className="flex items-center gap-1.5">
                                                              <Input
                                                                  type="number"
                                                                  step="any"
                                                                  value={v.price}
                                                                  onChange={(e) => handleUpdateVariant(idx, "price", parseFloat(e.target.value) || 0)}
                                                                  className="bg-white text-xs border-slate-300 min-w-[70px]"
                                                              />
                                                              <select
                                                                  value={v.currencyId ?? (v.currency === "$" ? 1 : v.currency === "€" ? 20 : 160)}
                                                                  onChange={(e) => {
                                                                      const curId = parseInt(e.target.value, 10);
                                                                      const curSym = curId === 1 ? "$" : curId === 20 ? "€" : "₺";
                                                                      handleUpdateVariant(idx, "currencyId", curId);
                                                                      handleUpdateVariant(idx, "currency", curSym);
                                                                  }}
                                                                  className="h-8 text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-1.5 py-0.5 focus:ring-1 focus:ring-red-500 cursor-pointer text-slate-700 select-none shrink-0"
                                                              >
                                                                  <option value={160}>₺ TL</option>
                                                                  <option value={1}>$ USD</option>
                                                                  <option value={20}>€ EUR</option>
                                                              </select>
                                                          </div>
                                                      </td>
                                                     <td className="p-3.5">
                                                         <Input
                                                             type="number"
                                                             value={v.stock}
                                                             onChange={(e) => handleUpdateVariant(idx, "stock", parseInt(e.target.value, 10) || 0)}
                                                             className="bg-white text-xs border-slate-300"
                                                         />
                                                     </td>
                                                     <td className="p-3.5 text-center">
                                                         <button
                                                             type="button"
                                                             onClick={() => handleUpdateVariant(idx, "active", !(v.active !== false))}
                                                             className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                                                                 v.active !== false
                                                                     ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                                                     : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                                             }`}
                                                             title={v.active !== false ? "Ürün Aktif (Tıkla Pasif Yap)" : "Ürün Pasif (Tıkla Aktif Yap)"}
                                                         >
                                                             {v.active !== false ? "Aktif" : "Pasif"}
                                                         </button>
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
                                            {individualFeatures && (
                                                <td className="p-3.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedVariantFeatures(expandedVariantFeatures === idx ? null : idx)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                                            expandedVariantFeatures === idx
                                                                ? "bg-amber-100 text-amber-700 border-amber-300"
                                                                : (v.features && v.features.length > 0)
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                                                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                                        }`}
                                                        title={`${(v.features || []).length} bireysel teknik özellik`}
                                                    >
                                                        <Sliders className="w-3.5 h-3.5" />
                                                        {(v.features || []).length}
                                                        {expandedVariantFeatures === idx ? (
                                                            <ChevronUp className="w-3 h-3" />
                                                        ) : (
                                                            <ChevronDown className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                </td>
                                            )}
                                            <td className="p-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setVariantImageFinderTarget({ index: idx, product: v })}
                                                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                                                        title="Bu Ürün İçin Web'den Resim Bul"
                                                    >
                                                        <Sparkles className="w-4 h-4" />
                                                    </button>
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
                                                <td colSpan={9 + (individualImages ? 1 : 0) + (individualFeatures ? 1 : 0)} className="p-0">
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

                                                        {/* Upload & Finder Buttons */}
                                                        <div className="flex items-center gap-2">
                                                            <label className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all">
                                                                {isUploadingVariantImage === idx ? (
                                                                    <>
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                        Yükleniyor...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Upload className="w-3.5 h-3.5" />
                                                                        Dosya Yükle
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

                                                            <Button
                                                                type="button"
                                                                onClick={() => setVariantImageFinderTarget({ index: idx, product: v })}
                                                                variant="outline"
                                                                className="border-amber-300 text-amber-800 bg-white hover:bg-amber-100 text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                                                Web&apos;den Resim Bul
                                                            </Button>
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
                                        {/* Expandable Individual Features Panel */}
                                        {individualFeatures && expandedVariantFeatures === idx && (
                                            <tr>
                                                <td colSpan={9 + (individualImages ? 1 : 0) + (individualFeatures ? 1 : 0)} className="p-0">
                                                    <div className="bg-amber-50/50 border-t border-b border-amber-200/60 px-5 py-4 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                                                                <Sliders className="w-4 h-4 text-amber-600" />
                                                                {v.variantLabel || v.name || `Ürün #${v.productId}`} — Bireysel Teknik Özellikler
                                                            </h4>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleAddVariantFeature(idx)}
                                                                    className="text-xs text-amber-700 border-amber-300 hover:bg-amber-100 bg-white"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5 mr-1" /> Özellik Ekle
                                                                </Button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setExpandedVariantFeatures(null)}
                                                                    className="p-1 text-amber-500 hover:text-amber-700 cursor-pointer"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {(!v.features || v.features.length === 0) ? (
                                                            <div className="p-4 text-center border border-dashed border-amber-300 rounded-lg bg-amber-50/50">
                                                                <Sliders className="w-6 h-6 text-amber-300 mx-auto mb-1" />
                                                                <p className="text-[11px] text-amber-500">Bu ürüne özel teknik özellik eklenmemiş.</p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                                                {v.features.map((feat, featIdx) => (
                                                                    <div key={featIdx} className="flex gap-2 items-center">
                                                                        <Input
                                                                            placeholder="Özellik (Örn: Depo Hacmi)"
                                                                            value={feat.feature}
                                                                            onChange={(e) => handleUpdateVariantFeature(idx, featIdx, "feature", e.target.value)}
                                                                            className="bg-white text-xs flex-1 border-amber-200"
                                                                        />
                                                                        <Input
                                                                            placeholder="Değer (Örn: 600 cc)"
                                                                            value={feat.description}
                                                                            onChange={(e) => handleUpdateVariantFeature(idx, featIdx, "description", e.target.value)}
                                                                            className="bg-white text-xs flex-1 border-amber-200"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveVariantFeature(idx, featIdx)}
                                                                            className="text-amber-400 hover:text-red-600 p-1.5 cursor-pointer"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
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

            {/* Product Selection Modal */}
            <ProductSelectModal
                isOpen={isSelectModalOpen}
                onClose={() => setIsSelectModalOpen(false)}
                initialSelectedProducts={variants}
                brands={brands}
                categories={categories}
                currentGroupId={groupId}
                currentGroupCode={groupCode}
                onApply={handleApplyModalSelection}
            />

            {/* Shared Images Finder Modal */}
            <ProductImageFinderModal
                isOpen={isSharedImageFinderOpen}
                onClose={() => setIsSharedImageFinderOpen(false)}
                productName={groupName || (variants[0]?.name)}
                productCode={groupCode || (variants[0]?.code)}
                brandName={brands.find((b: any) => b.id?.toString() === brandId)?.name}
                categoryName={categories.find((c: any) => c.id?.toString() === categoryId)?.name}
                existingImageCount={images.length}
                onImagesSelected={(newImgs) => {
                    setImages((prev) => [...prev, ...newImgs]);
                }}
            />

            {/* Variant Individual Image Finder Modal */}
            {variantImageFinderTarget && (
                <ProductImageFinderModal
                    isOpen={true}
                    onClose={() => setVariantImageFinderTarget(null)}
                    productName={variantImageFinderTarget.product.name}
                    productCode={variantImageFinderTarget.product.code}
                    brandName={brands.find((b: any) => b.id?.toString() === brandId)?.name}
                    categoryName={categories.find((c: any) => c.id?.toString() === categoryId)?.name}
                    existingImageCount={(variantImageFinderTarget.product.images || []).length}
                    onImagesSelected={(newImgs) => {
                        const targetIdx = variantImageFinderTarget.index;
                        setVariants((prev) => {
                            const updated = [...prev];
                            const existing = updated[targetIdx].images || [];
                            updated[targetIdx] = {
                                ...updated[targetIdx],
                                images: [...existing, ...newImgs],
                            };
                            return updated;
                        });
                        setVariantImageFinderTarget(null);
                    }}
                />
            )}
        </div>
    );
}

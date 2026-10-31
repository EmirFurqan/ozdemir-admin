"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveBanner } from "@/app/actions/banner";
import { Loader2, Upload, X, Image as ImageIcon, Sparkles, Eye } from "lucide-react";
import Image from "next/image";
import { Banner } from "@/app/services/bannerService";

interface BannerFormProps {
    banner?: Partial<Banner>;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function BannerForm({ banner, onSuccess, onCancel }: BannerFormProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(banner?.imageUrl || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form fields state
    const [title, setTitle] = useState(banner?.title || "");
    const [description, setDescription] = useState(banner?.description || "");
    const [linkUrl, setLinkUrl] = useState(banner?.linkUrl || "");
    const [displayOrder, setDisplayOrder] = useState(banner?.displayOrder?.toString() || "0");
    const [isActive, setIsActive] = useState(banner?.isActive ?? banner?.active ?? true);
    const [hasAnimation, setHasAnimation] = useState(banner?.hasAnimation ?? true);
    const [hasDarkOverlay, setHasDarkOverlay] = useState(banner?.hasDarkOverlay ?? true);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", e.target.files[0]);
        formData.append("type", "banner");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setImageUrl(data.url);
            } else {
                alert("Resim yüklenemedi. Lütfen tekrar deneyin.");
            }
        } catch (error) {
            console.error("Upload error", error);
            alert("Resim yüklenirken hata oluştu.");
        } finally {
            setIsUploading(false);
            e.target.value = ""; // Reset input
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        const formData = new FormData();
        if (banner?.id) formData.append("id", banner.id.toString());
        formData.append("title", title);
        formData.append("description", description);
        formData.append("linkUrl", linkUrl);
        formData.append("imageUrl", imageUrl);
        formData.append("displayOrder", displayOrder);
        formData.append("isActive", isActive ? "true" : "false");
        formData.append("hasAnimation", hasAnimation ? "true" : "false");
        formData.append("hasDarkOverlay", hasDarkOverlay ? "true" : "false");

        try {
            const result = await saveBanner(null, formData);
            if (result.success) {
                onSuccess();
            } else {
                setError(result.message || "Bir hata oluştu.");
            }
        } catch (err) {
            setError("Beklenmedik bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getFullImageUrl = (url: string) => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:8080";
        return `${baseUrl}${url}`;
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Image Upload */}
            <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <label className="block text-sm font-semibold text-slate-900 mb-3">Banner Görseli</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors aspect-video relative group">
                        {imageUrl ? (
                            <>
                                <Image
                                    src={getFullImageUrl(imageUrl)}
                                    alt="Preview"
                                    fill
                                    className="object-cover rounded-md"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setImageUrl("")}
                                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <label className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center absolute inset-0">
                                {isUploading ? (
                                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                                ) : (
                                    <Upload className="w-8 h-8 text-slate-400" />
                                )}
                                <span className="text-sm text-slate-500 font-medium">Görsel Seç veya Sürükle</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 text-center">Önerilen boyut: 1920x600px (JPG, PNG)</p>
                </div>

                {/* Live Preview */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-900">Canlı Önizleme</h3>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${hasAnimation ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                {hasAnimation ? '⚡ Animasyonlu' : 'Sabit'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${hasDarkOverlay ? 'bg-zinc-800 text-zinc-100' : 'bg-amber-100 text-amber-800'}`}>
                                {hasDarkOverlay ? 'Karartma Açık' : 'Karartma Yok'}
                            </span>
                        </div>
                    </div>
                    <div className="relative w-full aspect-[19/9] rounded-lg overflow-hidden bg-slate-900 shadow-inner group">
                        {imageUrl ? (
                            <Image
                                src={getFullImageUrl(imageUrl)}
                                alt="Preview"
                                fill
                                className={`object-cover transition-all duration-700 ${hasAnimation ? 'group-hover:scale-105' : ''} ${hasDarkOverlay ? 'opacity-85' : 'opacity-100'}`}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">
                                <ImageIcon className="w-8 h-8 opacity-20" />
                            </div>
                        )}

                        {/* Overlay Gradient */}
                        {hasDarkOverlay && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 pointer-events-none" />
                        )}

                        {/* Content */}
                        <div className="absolute bottom-3 left-6 p-6 w-full text-white">
                            <h4 className="text-[20px] font-bold mb-2 max-w-[55%] line-clamp-2 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                {title || "Banner Başlığı"}
                            </h4>
                            <p className="text-[6px] text-slate-200 mb-2 max-w-[55%] opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                {description || ""}
                            </p>
                            {linkUrl && (
                                <span className="inline-flex items-center text-[8px] font-semibold bg-white text-slate-900 px-2 py-1 rounded-full shadow">
                                    Daha Fazla
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 text-center">Temsili görünümdür. Cihaz boyutuna göre değişebilir.</p>
                </div>
            </div>

            {/* Right Column: Form Fields */}
            <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Banner Detayları</h3>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700">Başlık</label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Banner Başlığı"
                            required
                            className="bg-slate-50"
                        />
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                        {/* Link URL */}
                        <div className="col-span-8 space-y-1.5">
                            <label htmlFor="linkUrl" className="block text-sm font-medium text-slate-700">Yönlendirme Linki</label>
                            <Input
                                id="linkUrl"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="/products/category-1"
                                className="bg-slate-50"
                            />
                        </div>

                        {/* Display Order */}
                        <div className="col-span-4 space-y-1.5">
                            <label htmlFor="displayOrder" className="block text-sm font-medium text-slate-700">Sıra</label>
                            <Input
                                id="displayOrder"
                                type="number"
                                value={displayOrder}
                                onChange={(e) => setDisplayOrder(e.target.value)}
                                className="bg-slate-50"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700">Açıklama</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Banner üzerinde görünecek kısa açıklama..."
                            className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        />
                    </div>

                    {/* Banner Display & Animation Settings */}
                    <div className="space-y-3 pt-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Görünüm ve Animasyon Ayarları
                        </label>

                        {/* Animation Toggle */}
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-colors ${hasAnimation ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-900">Animasyon Aktif</span>
                                    <span className="text-xs text-slate-500">Slider geçişlerinde görsel yaklaştırma ve metin animasyonları çalışsın</span>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                                <input
                                    type="checkbox"
                                    checked={hasAnimation}
                                    onChange={(e) => setHasAnimation(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {/* Dark Overlay / Filigran Toggle */}
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-colors ${hasDarkOverlay ? 'bg-zinc-800 text-zinc-100' : 'bg-slate-200 text-slate-500'}`}>
                                    <Eye className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-900">Siyah Karartma / Filigran</span>
                                    <span className="text-xs text-slate-500">Yazıların rahat okunması için görsel üzerine koyu degrade katman uygular</span>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                                <input
                                    type="checkbox"
                                    checked={hasDarkOverlay}
                                    onChange={(e) => setHasDarkOverlay(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                            </label>
                        </div>

                        {/* Active Status Toggle */}
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900">Yayın Durumu (Aktif)</span>
                                <span className="text-xs text-slate-500">Bu banner anasayfada yayında olsun</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1">
                            İptal
                        </Button>
                        <Button type="submit" disabled={isSubmitting || isUploading} className="flex-1 bg-red-600 hover:bg-red-700">
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {banner?.id ? "Değişiklikleri Kaydet" : "Banner'ı Oluştur"}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}

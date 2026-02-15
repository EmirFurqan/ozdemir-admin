"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveCategory } from "@/app/actions/category";
import { Category } from "@/app/services/categoryService";
import { Brands } from "@/app/services/brandService";

export default function CategoryForm({ category, brands }: { category?: Category; brands?: Brands[] }) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api";
    const [state, formAction] = useActionState(saveCategory, { message: "", success: false });
    const [imageUrl, setImageUrl] = useState<string>(category?.imageUrl || "");
    const [imagePreview, setImagePreview] = useState<string | null>(() => {
        if (!category?.imageUrl) return null;
        if (category.imageUrl.startsWith('http')) return category.imageUrl;
        const baseUrl = API_URL.replace('/api', '');
        if (category.imageUrl.startsWith('/')) return `${baseUrl}${category.imageUrl}`;
        return `${baseUrl}/uploads/${category.imageUrl}`;
    });
    const [uploading, setUploading] = useState(false);
    const [brandId, setBrandId] = useState<string>(category?.brand?.id?.toString() || "");
    const [dimensionWarning, setDimensionWarning] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", "misc");

            const response = await fetch(`${API_URL}/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }
            const data = await response.json();

            // data.url is the full path e.g. /uploads/misc/filename-ts.ext
            const baseUrl = API_URL.replace('/api', '');
            setImagePreview(`${baseUrl}${data.url}`);
            setImageUrl(data.url);

        } catch (error) {
            console.error("Upload error:", error);
            alert("Resim yüklenirken hata oluştu.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <form action={formAction} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 space-y-8">
                <input type="hidden" name="id" value={category?.id || "new"} />
                <input type="hidden" name="imageUrl" value={imageUrl} />

                <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">1</span>
                            <h3 className="font-semibold text-slate-900">Kategori Bilgileri</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Kategori Adı</label>
                                <Input
                                    name="name"
                                    defaultValue={category?.name}
                                    required
                                    placeholder="Örn: Havalı Aletler"
                                    className="h-11 border-slate-200 focus:border-red-500 focus:ring-red-500 rounded-lg"
                                />
                            </div>
                            {dimensionWarning && (
                                <div className="space-y-2 text-red-600 text-sm">
                                    <p className="font-semibold">Boyut Uyarısı</p>
                                    <p>Yüklediğiniz görsel 16:9 formatında değil. Standartlara uymak için lütfen <b>1280x720px</b> boyutlarında görsel yükleyiniz.</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Marka</label>
                                <div className="relative">
                                    <select
                                        name="brandId"
                                        value={brandId}
                                        onChange={(e) => setBrandId(e.target.value)}
                                        className="flex w-full h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 appearance-none cursor-pointer"
                                    >
                                        <option value="">Marka Seçiniz</option>
                                        {brands?.map((brand) => (
                                            <option key={brand.id} value={brand.id}>
                                                {brand.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">Bu kategori hangi markaya ait?</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">2</span>
                            <h3 className="font-semibold text-slate-900">Kategori Görseli</h3>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-700">Görsel Yükle</label>

                            <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-all duration-200 relative group cursor-pointer
                                ${imagePreview ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 hover:border-red-300 hover:bg-red-50/10'}
                            `}>
                                {imagePreview ? (
                                    <div className="relative w-full h-48 flex items-center justify-center p-4">
                                        <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain drop-shadow-sm" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg backdrop-blur-[2px]">
                                            <div className="bg-white/90 text-slate-900 text-sm font-semibold px-4 py-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                Görseli Değiştir
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-sm shadow-red-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image-plus"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" /><line x1="16" y1="5" x2="22" y2="5" /><line x1="19" y1="2" x2="19" y2="8" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                        </div>
                                        <p className="text-base font-semibold text-slate-900">Görsel Yükle</p>
                                        <p className="text-sm text-slate-500 mt-1">PNG, JPG, WEBP • Max 2MB</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={uploading}
                                />
                            </div>

                            {uploading && (
                                <div className="flex items-center gap-2 text-sm text-red-600 animate-pulse justify-center bg-red-50 py-2 rounded-lg">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Görsel yükleniyor...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {state?.message && (
                    <div className={`p-4 rounded-xl text-sm border flex items-center gap-3 ${state.success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {state.success ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                        )}
                        {state.message}
                    </div>
                )}
            </div>

            <div className="bg-slate-50/80 px-8 py-6 flex items-center justify-end gap-3 border-t border-slate-200">
                <Button
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm h-11 px-6"
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                >
                    İptal
                </Button>
                <Button
                    className="bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200 h-11 px-8"
                    type="submit"
                    disabled={uploading}
                >
                    {uploading ? 'Yükleniyor...' : (category?.id ? 'Değişiklikleri Kaydet' : 'Kategori Oluştur')}
                </Button>
            </div>
        </form>
    );
}

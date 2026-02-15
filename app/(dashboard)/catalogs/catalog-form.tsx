'use client';

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
// Removed missing imports: Input, Textarea, Label
import { saveCatalog } from "@/app/actions/catalog";
// @ts-ignore
import { useFormStatus } from "react-dom"; // Experimental hooks, check if project uses them or just regular form submission
import { catalogService } from "@/app/services/catalogService";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";


function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending} className="bg-red-600 hover:bg-red-700 w-full">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                </>
            ) : (
                "Kaydet"
            )}
        </Button>
    );
}

interface CatalogFormProps {
    initialData?: {
        id: number;
        name: string;
        description: string;
        url: string;
        imgUrl: string;
        type: string;
        releaseDate: string;
    };
}

export default function CatalogForm({ initialData }: CatalogFormProps) {
    const [state, formAction] = useActionState(saveCatalog, { success: false, message: "" });

    // File upload states
    const [pdfUrl, setPdfUrl] = useState(initialData?.url || "");
    const [imgUrl, setImgUrl] = useState(initialData?.imgUrl || "");
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPdf(true);
        try {
            const res = await catalogService.uploadFile(file);
            setPdfUrl(res);
        } catch (err) {
            console.error(err);
            alert("PDF yüklenirken hata oluştu");
        } finally {
            setUploadingPdf(false);
        }
    };

    const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImg(true);
        try {
            const res = await catalogService.uploadFile(file);
            setImgUrl(res);
        } catch (err) {
            console.error(err);
            alert("Resim yüklenirken hata oluştu");
        } finally {
            setUploadingImg(false);
        }
    };

    return (
        <form action={formAction} className="space-y-6 mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            {initialData && <input type="hidden" name="id" value={initialData.id} />}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Katalog Adı</label>
                <div className="relative">
                    <input
                        name="name"
                        required
                        defaultValue={initialData?.name}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Örn: 2024 Genel Katalog"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="releaseDate" className="block text-sm font-medium text-slate-700 mb-1">Yayın Tarihi/Dönemi</label>
                    <input
                        name="releaseDate"
                        required
                        defaultValue={initialData?.releaseDate}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Örn: Ekim 2025"
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">Tür</label>
                    <select
                        name="type"
                        defaultValue={initialData?.type}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="PDF">PDF</option>
                        <option value="Link">Harici Link</option>
                    </select>
                </div>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                <textarea
                    name="description"
                    required
                    defaultValue={initialData?.description}
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Katalog hakkında kısa açıklama..."
                />
            </div>
            {/* The rest of the form (file uploads) uses standard Inputs already */}

            <div className="grid md:grid-cols-2 gap-6">
                {/* PDF Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Katalog Dosyası (PDF)</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
                        {uploadingPdf ? (
                            <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-2" />
                        ) : pdfUrl ? (
                            <div className="space-y-2">
                                <div className="text-green-600 font-medium flex items-center justify-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    Yüklendi
                                </div>
                                <p className="text-xs text-slate-500 break-all">{pdfUrl.split('/').pop()}</p>
                                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('pdf-upload')?.click()}>
                                    Değiştir
                                </Button>
                            </div>
                        ) : (
                            <div onClick={() => document.getElementById('pdf-upload')?.click()} className="cursor-pointer space-y-2">
                                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                                <span className="text-sm text-slate-600 font-medium">Dosya Seç veya Sürükle</span>
                                <p className="text-xs text-slate-400">PDF, max 50MB</p>
                            </div>
                        )}
                        <input
                            id="pdf-upload"
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handlePdfUpload}
                        />
                        <input type="hidden" name="url" value={pdfUrl} required />
                    </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kapak Görseli</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors relative h-[200px]">
                        {uploadingImg ? (
                            <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-2" />
                        ) : imgUrl ? (
                            <div className="absolute inset-0 w-full h-full p-2">
                                <div className="relative w-full h-full rounded overflow-hidden">
                                    <Image
                                        src={imgUrl.startsWith("http") ? imgUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || "http://127.0.0.1:8080"}${imgUrl}`}
                                        alt="Cover"
                                        fill
                                        className="object-contain bg-slate-100"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        className="absolute bottom-2 right-2"
                                        onClick={() => document.getElementById('img-upload')?.click()}
                                    >
                                        Değiştir
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => document.getElementById('img-upload')?.click()} className="cursor-pointer space-y-2">
                                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                                <span className="text-sm text-slate-600 font-medium">Görsel Seç</span>
                                <p className="text-xs text-slate-400">JPG, PNG</p>
                            </div>
                        )}
                        <input
                            id="img-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImgUpload}
                        />
                        <input type="hidden" name="imgUrl" value={imgUrl} required />
                    </div>
                </div>
            </div>

            {state.message && (
                <div className={`p-4 rounded-md ${state.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {state.message}
                </div>
            )}

            <SubmitButton />
        </form>
    );
}

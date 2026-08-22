"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Search,
    Globe,
    Link as LinkIcon,
    Download,
    Check,
    X,
    Maximize2,
    Loader2,
    RefreshCw,
    Sparkles,
    CheckSquare,
    Square,
    AlertCircle,
    ExternalLink,
    Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    searchImagesAction,
    scrapePageImagesAction,
    downloadAndSaveImagesAction,
    FoundImageResult
} from "@/app/actions/imageSearch";

interface ProductImageFinderModalProps {
    isOpen: boolean;
    onClose: () => void;
    productName?: string;
    productCode?: string;
    brandName?: string;
    categoryName?: string;
    onImagesSelected: (newImages: { url: string; isMain: boolean; displayOrder: number }[]) => void;
    existingImageCount?: number;
}

export default function ProductImageFinderModal({
    isOpen,
    onClose,
    productName = "",
    productCode = "",
    brandName = "",
    categoryName = "",
    onImagesSelected,
    existingImageCount = 0,
}: ProductImageFinderModalProps) {
    // Tabs: "search" | "scrape" | "direct"
    const [activeTab, setActiveTab] = useState<"search" | "scrape" | "direct">("search");

    // Search query state
    const [searchQuery, setSearchQuery] = useState("");
    const [pageUrl, setPageUrl] = useState("");
    const [directUrlsText, setDirectUrlsText] = useState("");

    // Results state
    const [searchResults, setSearchResults] = useState<FoundImageResult[]>([]);
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Zoom preview state
    const [previewImage, setPreviewImage] = useState<FoundImageResult | null>(null);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Generate intelligent search chips based on product details
    const searchChips = useMemo(() => {
        const chips: { label: string; query: string; isDefault?: boolean }[] = [];
        const cleanBrand = brandName?.trim() || "";
        const cleanCode = productCode?.trim() || "";
        const cleanName = productName?.trim() || "";

        // 1. Recommended: Brand + Code
        if (cleanBrand && cleanCode) {
            chips.push({
                label: `${cleanBrand} ${cleanCode}`,
                query: `${cleanBrand} ${cleanCode}`,
                isDefault: true,
            });
        }

        // 2. Brand + Code + Name (Full)
        if (cleanBrand && cleanCode && cleanName && cleanName !== cleanCode) {
            chips.push({
                label: `${cleanBrand} ${cleanCode} ${cleanName}`,
                query: `${cleanBrand} ${cleanCode} ${cleanName}`,
                isDefault: !chips.length,
            });
        } else if (cleanBrand && cleanName) {
            chips.push({
                label: `${cleanBrand} ${cleanName}`,
                query: `${cleanBrand} ${cleanName}`,
                isDefault: !chips.length,
            });
        }

        // 3. Just Code
        if (cleanCode) {
            chips.push({
                label: cleanCode,
                query: cleanCode,
                isDefault: !chips.length,
            });
        }

        // 4. Name only if long enough
        if (cleanName && cleanName !== cleanCode && cleanName !== cleanBrand) {
            chips.push({
                label: cleanName,
                query: cleanName,
            });
        }

        return chips;
    }, [productName, productCode, brandName]);

    // Initial setup on open
    useEffect(() => {
        if (isOpen) {
            setErrorMessage(null);
            setSelectedUrls(new Set());
            setPreviewImage(null);

            // Set default best query
            const defaultQuery = searchChips[0]?.query || `${brandName} ${productCode} ${productName}`.trim();
            setSearchQuery(defaultQuery);

            // Auto-trigger search if query exists
            if (defaultQuery) {
                handlePerformSearch(defaultQuery);
            }

            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 150);
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                if (previewImage) {
                    setPreviewImage(null);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, previewImage]);

    // Search executor
    const handlePerformSearch = async (queryToSearch?: string) => {
        const q = queryToSearch !== undefined ? queryToSearch : searchQuery;
        if (!q.trim()) return;

        setLoading(true);
        setErrorMessage(null);
        try {
            const res = await searchImagesAction({ query: q.trim(), limit: 40 });
            if (res.success) {
                setSearchResults(res.results);
                if (res.results.length === 0) {
                    setErrorMessage("Aramanıza uygun görsel bulunamadı. Lütfen filtre çiplerini deneyin veya arama terimini değiştirin.");
                }
            } else {
                setSearchResults([]);
                setErrorMessage(res.message || "Görseller aranırken bir sorun oluştu.");
            }
        } catch (err: any) {
            console.error("Search error:", err);
            setSearchResults([]);
            setErrorMessage("Arama gerçekleştirilemedi. Lütfen bağlantınızı kontrol edin.");
        } finally {
            setLoading(false);
        }
    };

    // Scrape webpage executor
    const handlePerformScrape = async () => {
        if (!pageUrl.trim()) return;

        setLoading(true);
        setErrorMessage(null);
        try {
            const res = await scrapePageImagesAction({ pageUrl: pageUrl.trim() });
            if (res.success) {
                setSearchResults(res.images);
                if (res.images.length === 0) {
                    setErrorMessage("Bu web sayfasında doğrudan ürün görseli bulunamadı.");
                }
            } else {
                setSearchResults([]);
                setErrorMessage(res.message || "Sayfa taranamadı.");
            }
        } catch (err: any) {
            console.error("Scrape error:", err);
            setSearchResults([]);
            setErrorMessage("Sayfa taranırken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    // Direct URLs parser
    const handleParseDirectUrls = () => {
        if (!directUrlsText.trim()) return;

        const lines = directUrlsText
            .split(/[\n,]+/)
            .map((u) => u.trim())
            .filter((u) => u.startsWith("http://") || u.startsWith("https://"));

        if (lines.length === 0) {
            setErrorMessage("Geçerli bir görsel linki (http/https) bulunamadı.");
            return;
        }

        const results: FoundImageResult[] = lines.map((url, idx) => {
            let domain = "";
            try {
                domain = new URL(url).hostname.replace(/^www\./, "");
            } catch {
                domain = "";
            }
            return {
                url,
                thumbUrl: url,
                title: `${productName || "Ürün Görseli"} #${idx + 1}`,
                domain,
            };
        });

        setSearchResults(results);
        // Auto-select all direct URLs
        setSelectedUrls(new Set(results.map((r) => r.url)));
        setErrorMessage(null);
    };

    // Toggle image selection
    const toggleSelect = (url: string) => {
        setSelectedUrls((prev) => {
            const next = new Set(prev);
            if (next.has(url)) {
                next.delete(url);
            } else {
                next.add(url);
            }
            return next;
        });
    };

    // Select all / Deselect all
    const handleSelectAll = () => {
        if (selectedUrls.size === searchResults.length) {
            setSelectedUrls(new Set());
        } else {
            setSelectedUrls(new Set(searchResults.map((r) => r.url)));
        }
    };

    // Download & Save selected images
    const handleDownloadAndApply = async () => {
        const urlsToDownload = Array.from(selectedUrls);
        if (urlsToDownload.length === 0) return;

        setDownloading(true);
        setErrorMessage(null);

        try {
            const titleSlug = `${brandName ? brandName + "-" : ""}${productCode || productName || "urun"}`;
            const res = await downloadAndSaveImagesAction({
                urls: urlsToDownload,
                title: titleSlug,
                type: "product",
            });

            if (res.success && res.savedImages.length > 0) {
                const formattedImages = res.savedImages.map((img, idx) => ({
                    url: img.url,
                    isMain: existingImageCount === 0 && idx === 0,
                    displayOrder: existingImageCount + idx,
                }));

                onImagesSelected(formattedImages);
                onClose();
            } else {
                setErrorMessage(res.message || "Görseller indirilirken bir hata oluştu.");
            }
        } catch (err: any) {
            console.error("Download error:", err);
            setErrorMessage("Görseller kaydedilemedi. Lütfen tekrar deneyin.");
        } finally {
            setDownloading(false);
        }
    };

    if (!isOpen) return null;

    const allSelected = searchResults.length > 0 && selectedUrls.size === searchResults.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-red-500/20">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-900">
                                    Web&apos;den Ürün Görseli Bul & İndir
                                </h2>
                                {selectedUrls.size > 0 && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        {selectedUrls.size} Seçili
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {brandName && <b className="text-slate-700 mr-1">{brandName}</b>}
                                {productCode && <span className="font-mono text-slate-600 mr-1">[{productCode}]</span>}
                                {productName && <span className="text-slate-500 truncate max-w-md">{productName}</span>}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        title="Kapat (Esc)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="px-6 pt-3 pb-0 bg-slate-50 border-b border-slate-200/80 flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab("search")}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                            activeTab === "search"
                                ? "bg-white text-red-600 border-red-600 shadow-xs"
                                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100"
                        }`}
                    >
                        <Search className="w-3.5 h-3.5" />
                        Görsel Arama Motoru
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("scrape")}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                            activeTab === "scrape"
                                ? "bg-white text-red-600 border-red-600 shadow-xs"
                                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100"
                        }`}
                    >
                        <Globe className="w-3.5 h-3.5" />
                        Web Sayfasından Çek (URL)
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("direct")}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                            activeTab === "direct"
                                ? "bg-white text-red-600 border-red-600 shadow-xs"
                                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100"
                        }`}
                    >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Doğrudan Görsel Linki
                    </button>
                </div>

                {/* Search / Input Controls Section */}
                <div className="p-4 bg-white border-b border-slate-100 space-y-3 shrink-0">
                    {activeTab === "search" && (
                        <div className="space-y-2.5">
                            {/* Search Bar */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handlePerformSearch();
                                }}
                                className="flex items-center gap-2"
                            >
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <Input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Marka, model veya ürün adı ile görsel arayın..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-8 bg-slate-50 border-slate-200 text-xs h-10 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || !searchQuery.trim()}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 px-5 rounded-xl cursor-pointer shrink-0 shadow-sm"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                            Aranıyor...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4 mr-1.5" />
                                            Görsel Ara
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Quick Suggestion Chips */}
                            {searchChips.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                    <span className="text-[11px] font-semibold text-slate-400 mr-1">
                                        Hızlı Öneriler:
                                    </span>
                                    {searchChips.map((chip, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery(chip.query);
                                                handlePerformSearch(chip.query);
                                            }}
                                            className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                                                searchQuery === chip.query
                                                    ? "bg-red-50 text-red-700 border-red-200 shadow-2xs font-semibold"
                                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                                            }`}
                                        >
                                            {chip.isDefault && <span className="text-red-500 mr-1">★</span>}
                                            {chip.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "scrape" && (
                        <div className="space-y-2">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handlePerformScrape();
                                }}
                                className="flex items-center gap-2"
                            >
                                <div className="relative flex-1">
                                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <Input
                                        type="url"
                                        placeholder="Örn: https://www.bosch-professional.com/tr/tr/products/gws-750..."
                                        value={pageUrl}
                                        onChange={(e) => setPageUrl(e.target.value)}
                                        className="pl-9 pr-8 bg-slate-50 border-slate-200 text-xs h-10 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20"
                                    />
                                    {pageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setPageUrl("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || !pageUrl.trim()}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 px-5 rounded-xl cursor-pointer shrink-0 shadow-sm"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                            Taranıyor...
                                        </>
                                    ) : (
                                        <>
                                            <Globe className="w-4 h-4 mr-1.5" />
                                            Sayfayı Tara & Çek
                                        </>
                                    )}
                                </Button>
                            </form>
                            <p className="text-[11px] text-slate-400">
                                Üretici, bayi veya katalog sayfasının linkini yapıştırarak sayfadaki tüm yüksek çözünürlüklü ürün fotoğraflarını ayıklayabilirsiniz.
                            </p>
                        </div>
                    )}

                    {activeTab === "direct" && (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <textarea
                                    rows={2}
                                    placeholder="Her satıra bir adet görsel linki (http:// veya https:// ile başlayan) yapıştırın..."
                                    value={directUrlsText}
                                    onChange={(e) => setDirectUrlsText(e.target.value)}
                                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 resize-none font-mono"
                                />
                                <Button
                                    type="button"
                                    onClick={handleParseDirectUrls}
                                    disabled={!directUrlsText.trim()}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-auto px-5 rounded-xl cursor-pointer shrink-0"
                                >
                                    Listeye Al
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="mx-6 my-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Image Results Grid */}
                <div className="flex-1 overflow-y-auto p-6 min-h-[340px] max-h-[50vh] bg-slate-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 animate-spin" />
                            </div>
                            <span className="text-xs font-semibold text-slate-600">
                                Yüksek kaliteli ürün görselleri aranıyor...
                            </span>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                            <ImageIcon className="w-10 h-10 text-slate-300" />
                            <p className="text-xs font-medium text-slate-500 text-center">
                                Henüz listelenecek görsel bulunamadı.
                            </p>
                            <p className="text-[11px] text-slate-400 text-center max-w-sm">
                                Yukarıdaki arama çubuğundan farklı bir terim aratabilir veya önerilen butonlara tıklayabilirsiniz.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {/* Toolbar above grid */}
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-red-600 transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
                                    >
                                        {allSelected ? (
                                            <>
                                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                                                Seçimleri Kaldır
                                            </>
                                        ) : (
                                            <>
                                                <Square className="w-4 h-4 text-slate-400" />
                                                Tümünü Seç ({searchResults.length})
                                            </>
                                        )}
                                    </button>
                                    <span className="text-xs text-slate-400">
                                        Toplam <b>{searchResults.length}</b> görsel bulundu
                                    </span>
                                </div>

                                {selectedUrls.size > 0 && (
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                                        ✓ {selectedUrls.size} görsel seçildi
                                    </span>
                                )}
                            </div>

                            {/* Card Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {searchResults.map((item, index) => {
                                    const isSelected = selectedUrls.has(item.url);
                                    return (
                                        <div
                                            key={index}
                                            onClick={() => toggleSelect(item.url)}
                                            className={`group relative rounded-2xl bg-white border-2 overflow-hidden flex flex-col transition-all cursor-pointer select-none ${
                                                isSelected
                                                    ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                                                    : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                                            }`}
                                        >
                                            {/* Image container */}
                                            <div className="relative aspect-square w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={item.thumbUrl || item.url}
                                                    alt={item.title || "Görsel"}
                                                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        (e.target as HTMLElement).style.display = "none";
                                                    }}
                                                />

                                                {/* Selection Checkbox Pill */}
                                                <div className="absolute top-2 left-2 z-10">
                                                    <div
                                                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                                            isSelected
                                                                ? "bg-emerald-600 text-white shadow-sm"
                                                                : "bg-white/90 text-transparent border border-slate-300 group-hover:border-slate-400 backdrop-blur-xs"
                                                        }`}
                                                    >
                                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                    </div>
                                                </div>

                                                {/* Zoom Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewImage(item);
                                                    }}
                                                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-xs cursor-pointer"
                                                    title="Büyük Önizleme"
                                                >
                                                    <Maximize2 className="w-3.5 h-3.5" />
                                                </button>

                                                {/* Resolution Badge */}
                                                {item.width && item.height ? (
                                                    <div className="absolute bottom-2 right-2 z-10 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono backdrop-blur-xs">
                                                        {item.width}×{item.height}
                                                    </div>
                                                ) : null}
                                            </div>

                                            {/* Details metadata */}
                                            <div className="p-2.5 bg-white border-t border-slate-100 flex flex-col gap-1">
                                                <p
                                                    className="text-[11px] font-medium text-slate-800 line-clamp-1 leading-tight"
                                                    title={item.title}
                                                >
                                                    {item.title || "Ürün Görseli"}
                                                </p>
                                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                                    <span className="truncate max-w-[120px]">
                                                        {item.domain || "Web"}
                                                    </span>
                                                    {item.sourcePageUrl && (
                                                        <a
                                                            href={item.sourcePageUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-slate-400 hover:text-slate-600"
                                                            title="Kaynağa Git"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="font-semibold">
                            Seçilen:{" "}
                            <b className="text-emerald-700 text-sm">
                                {selectedUrls.size} Adet
                            </b>
                        </span>
                        {selectedUrls.size > 0 && (
                            <span className="text-slate-400 text-[11px]">
                                (Otomatik 2048x2048 beyaz zemin formatına dönüştürülecektir)
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={downloading}
                            className="flex-1 sm:flex-initial text-xs h-10 px-5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                            Vazgeç
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDownloadAndApply}
                            disabled={downloading || selectedUrls.size === 0}
                            className="flex-1 sm:flex-initial text-xs h-10 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer shadow-md shadow-red-600/20 flex items-center justify-center gap-2"
                        >
                            {downloading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    İndiriliyor ve Ekleniyor...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Seçilenleri İndir ve Ekle ({selectedUrls.size})
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Enlarge / Full Size Preview Modal Popup */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
                            <span className="text-xs font-semibold truncate max-w-lg">
                                {previewImage.title}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPreviewImage(null)}
                                className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative max-h-[75vh] flex items-center justify-center bg-slate-100 p-4 overflow-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewImage.url}
                                alt={previewImage.title}
                                className="max-h-[70vh] w-auto object-contain rounded shadow"
                            />
                        </div>
                        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
                            <div>
                                {previewImage.width && previewImage.height ? (
                                    <span className="font-mono font-bold mr-2">
                                        {previewImage.width} × {previewImage.height} px
                                    </span>
                                ) : null}
                                <span className="text-slate-400">
                                    Kaynak: {previewImage.domain || previewImage.url}
                                </span>
                            </div>
                            <Button
                                type="button"
                                onClick={() => {
                                    toggleSelect(previewImage.url);
                                    setPreviewImage(null);
                                }}
                                className={`text-xs h-8 px-4 rounded-lg font-bold cursor-pointer ${
                                    selectedUrls.has(previewImage.url)
                                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                            >
                                {selectedUrls.has(previewImage.url) ? "Seçimi Kaldır" : "Görseli Seç"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

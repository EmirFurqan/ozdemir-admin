"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ProductImage } from "../services/productService";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
    images: ProductImage[];
    productName: string;
}

export function ProductGallery({ images, productName }: Props) {
    // If no images, show placeholder
    if (!images || images.length === 0) {
        return (
            <div className="relative w-full h-full max-h-[600px] aspect-square bg-white p-8 flex items-center justify-center rounded-xl border border-slate-100">
                <Image
                    src="/assets/product-placeholder.png"
                    alt={productName}
                    fill
                    className="object-contain"
                    priority
                />
            </div>
        );
    }

    // Sort images: Main first, then by order
    const sortedImages = [...images].sort((a, b) => {
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;
        return a.displayOrder - b.displayOrder;
    });

    const [mainImage, setMainImage] = useState(sortedImages[0]?.url);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Helper to get full URL
    const getImageUrl = (url: string) => {
        if (!url) return "/assets/product-placeholder.png";
        if (url.startsWith("http")) return url;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
        const baseUrl = API_URL.replace(/\/api$/, "");
        return `${baseUrl}${url}`;
    }

    const openLightbox = () => setIsLightboxOpen(true);
    const closeLightbox = () => setIsLightboxOpen(false);

    // Navigation Logic
    const currentIndex = sortedImages.findIndex(img => img.url === mainImage);

    const handleNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        const nextIndex = (currentIndex + 1) % sortedImages.length;
        setMainImage(sortedImages[nextIndex].url);
    }, [currentIndex, sortedImages]);

    const handlePrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        const prevIndex = (currentIndex - 1 + sortedImages.length) % sortedImages.length;
        setMainImage(sortedImages[prevIndex].url);
    }, [currentIndex, sortedImages]);

    // Keyboard support
    useEffect(() => {
        if (!isLightboxOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isLightboxOpen, handleNext, handlePrev]);

    return (
        <>
            <div className="flex flex-col gap-4 w-full h-full">
                {/* Main Image Area */}
                <div
                    className="relative w-full aspect-square bg-white rounded-xl overflow-hidden border border-slate-100 p-2 flex items-center justify-center cursor-zoom-in group"
                    onClick={openLightbox}
                >
                    <Image
                        src={getImageUrl(mainImage)}
                        alt={productName}
                        fill
                        className="object-contain transition-transform duration-500 group-hover:scale-105"
                        priority
                    />

                    {/* Hover Overlay Hint */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/2 transition-colors duration-300 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                            <ZoomIn className="w-6 h-6 text-slate-700" />
                        </div>
                    </div>
                </div>

                {/* Thumbnails */}
                {sortedImages.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                        {sortedImages.map((img) => (
                            <button
                                key={img.id}
                                onClick={() => setMainImage(img.url)}
                                className={`relative aspect-square bg-white rounded-lg border overflow-hidden transition-all ${mainImage === img.url
                                        ? "border-red-600 ring-2 ring-red-600/20 opacity-100"
                                        : "border-slate-200 hover:border-red-400 opacity-70 hover:opacity-100"
                                    }`}
                            >
                                <Image
                                    src={getImageUrl(img.url)}
                                    alt={`${productName} thumbnail`}
                                    fill
                                    className="object-contain p-2"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox Overlay */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
                    onClick={closeLightbox}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-all z-50 pointer-events-auto"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {/* Navigation Buttons */}
                    {sortedImages.length > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-3 rounded-full transition-all z-50 pointer-events-auto group"
                            >
                                <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-3 rounded-full transition-all z-50 pointer-events-auto group"
                            >
                                <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </>
                    )}

                    {/* Lightbox Image Container */}
                    <div
                        className="relative w-full h-full p-12 md:p-20 flex items-center justify-center"
                        // Removing stopPropagation here to allow clicks around the image to close the modal.
                        // But we want clicks ON the image to NOT close it?
                        // Actually, standard behavior is clicking anywhere closes it, unless it's a UI control.
                        // User complaint: "overlaye tıkladığımda kapanmıyor".
                        // With stopPropagation removed from this container, clicking the whitespace padding will bubble to the parent and close.
                        // Clicking the IMAGE itself will also bubble and close.
                        // If we want clicking image NOT to close:
                        onClick={(e) => {
                            // Only close if clicked directly on this container (whitespace), not image
                            if (e.target === e.currentTarget) closeLightbox();
                        }}
                    >
                        <div className="relative w-full h-full max-w-6xl max-h-[85vh] pointer-events-none">
                            {/* pointer-events-none on wrapper so clicks go through to the parent container? No, that would make image unclickable effectively (cannot right click save) */}
                            {/* Let's just wrap image in a div that stops prop only on itself */}
                            <div className="relative w-full h-full pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                <Image
                                    src={getImageUrl(mainImage)}
                                    alt={productName}
                                    fill
                                    className="object-contain select-none drop-shadow-2xl"
                                    quality={100}
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

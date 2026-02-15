"use client";

import { ImageWithFallback } from "@/app/components/ImageWithFallback";
import { ImageIcon } from "lucide-react";

interface TableImageProps {
    src?: string | null;
    alt: string;
    fallbackText?: string;
    className?: string;
}

export default function TableImage({ src, alt, fallbackText, className }: TableImageProps) {
    const API_ROOT = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://127.0.0.1:8080";

    // Normalize URL
    const imageUrl = src?.startsWith('http')
        ? src
        : src
            ? `${API_ROOT}${src.startsWith('/') ? '' : '/'}${src}`
            : null;

    return (
        <div className={`w-12 h-12 relative bg-white rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 ${className}`}>
            {imageUrl ? (
                <ImageWithFallback
                    src={imageUrl}
                    alt={alt}
                    fallbackText={fallbackText || alt}
                    className="w-full h-full object-contain p-1"
                />
            ) : (
                <ImageIcon className="w-5 h-5 text-slate-400" />
            )}
        </div>
    );
}

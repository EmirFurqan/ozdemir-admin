"use client";

import { useState } from "react";

interface ImageWithFallbackProps {
    src: string;
    alt: string;
    fallbackText: string;
    className?: string;
}

export function ImageWithFallback({ src, alt, fallbackText, className }: ImageWithFallbackProps) {
    const [error, setError] = useState(false);

    if (error || !src) {
        return (
            <div className={`flex items-center justify-center bg-slate-100 text-slate-400 font-bold text-xs ${className}`}>
                {fallbackText.charAt(0).toUpperCase()}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setError(true)}
        />
    );
}

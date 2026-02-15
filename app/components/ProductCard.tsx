"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Product {
    id: number;
    slug?: string;
    code: string;
    name: string;
    groupCode?: string;
    groupName?: string;
    imageUrl?: string;
}

interface ProductCardProps {
    product: Product;
    brandName?: string;
}

export function ProductCard({ product, brandName }: ProductCardProps) {
    return (
        <Link
            href={`/products/${product.slug || product.id}`}
            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
        >
            <div className="aspect-square bg-slate-50 p-6 relative flex items-center justify-center overflow-hidden">
                {brandName && (
                    <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-slate-800 shadow-sm border border-slate-100">
                        {brandName}
                    </div>
                )}
                <Image
                    src={product.imageUrl ? (product.imageUrl.startsWith("http") ? product.imageUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || "http://127.0.0.1:8080"}${product.imageUrl}`) : "/assets/product-placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-500"
                />
            </div>
            <div className="p-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {product.groupCode ? product.groupCode : product.code}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-red-600 transition-colors">
                    {product.groupName || product.name}
                </h3>
                <div className="flex items-center text-red-600 font-medium text-sm mt-4 group/btn">
                    İncele
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    );
}

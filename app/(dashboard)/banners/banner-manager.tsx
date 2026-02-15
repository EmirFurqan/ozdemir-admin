"use client";

import { Banner } from "@/app/services/bannerService";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import DeleteBannerButton from "./delete-banner-button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { DataTable, Column } from "@/app/components/DataTable";

export default function BannerManager({ initialBanners }: { initialBanners: Banner[] }) {

    const getImageUrl = (url: string) => {
        if (!url) return "/placeholder.png";
        if (url.startsWith("http")) return url;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:8080";
        return `${baseUrl}${url}`;
    };

    const columns: Column<Banner>[] = [
        {
            header: "Sıra",
            accessorKey: "displayOrder",
            className: "font-mono text-slate-600 w-20"
        },
        {
            header: "Görsel",
            cell: (banner) => (
                <div className="relative w-32 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    {banner.imageUrl ? (
                        <Image
                            src={getImageUrl(banner.imageUrl)}
                            alt={banner.title}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                            No Img
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Başlık / Açıklama",
            cell: (banner) => (
                <div>
                    <div className="font-medium text-slate-900">{banner.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[300px]">{banner.description}</div>
                </div>
            )
        },
        {
            header: "Durum",
            cell: (banner) => {
                const isActive = banner.isActive ?? banner.active ?? false;
                return (
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {isActive ? 'Aktif' : 'Pasif'}
                    </span>
                );
            }
        },
        {
            header: "İşlemler",
            className: "text-right",
            cell: (banner) => (
                <div className="flex justify-end gap-1">
                    <Link
                        href={`/banners/${banner.id}`}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 hover:text-slate-900 h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                        <Edit className="w-4 h-4" />
                    </Link>
                    <DeleteBannerButton id={banner.id} />
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Link href="/banners/new" className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-slate-50 hover:bg-red-700 h-10 px-4 py-2")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Banner Ekle
                </Link>
            </div>

            <DataTable
                data={initialBanners}
                columns={columns}
                keyExtractor={(item) => item.id}
                emptyMessage="Henüz banner eklenmemiş."
            />
        </div>
    );
}

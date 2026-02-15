import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
    searchParams?: { [key: string]: string | undefined };
}

export default function Pagination({ currentPage, totalPages, baseUrl, searchParams = {} }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageLink = (newPage: number) => {
        const params = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
            if (value !== undefined) {
                params.set(key, value);
            }
        });
        params.set("page", newPage.toString());
        return `${baseUrl}?${params.toString()}`;
    };

    return (
        <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
                Sayfa <span className="font-medium">{currentPage + 1}</span> / <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex gap-2">
                <Link
                    href={currentPage > 0 ? getPageLink(currentPage - 1) : "#"}
                    className={`p-2 rounded-lg border ${currentPage > 0 ? "border-slate-300 text-slate-600 hover:bg-slate-50" : "border-slate-100 text-slate-300 pointer-events-none"}`}
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <Link
                    href={currentPage < totalPages - 1 ? getPageLink(currentPage + 1) : "#"}
                    className={`p-2 rounded-lg border ${currentPage < totalPages - 1 ? "border-slate-300 text-slate-600 hover:bg-slate-50" : "border-slate-100 text-slate-300 pointer-events-none"}`}
                >
                    <ChevronRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
    );
}

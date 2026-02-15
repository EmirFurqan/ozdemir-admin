"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Brands } from "@/app/services/brandService";

interface CategoryFiltersProps {
    brands: Brands[];
    initialSearch?: string;
    initialBrandId?: string;
}

export default function CategoryFilters({ brands, initialBrandId }: CategoryFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Create a query string with updated parameters
    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            params.delete("page"); // Reset page on filter change
            return params.toString();
        },
        [searchParams]
    );

    const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const brandId = e.target.value;
        router.push("?" + createQueryString("brandId", brandId));
    };

    return (
        <div className="w-full sm:w-64">
            <select
                value={initialBrandId || ""}
                onChange={handleBrandChange}
                className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
            >
                <option value="">Tüm Markalar</option>
                {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                        {brand.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

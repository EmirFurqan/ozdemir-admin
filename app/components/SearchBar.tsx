"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

interface SearchBarProps {
    placeholder?: string;
    defaultValue?: string;
    className?: string;
}

export default function SearchBar({ placeholder = "Ara...", defaultValue = "", className }: SearchBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(defaultValue);

    // Update local state when URL params change (e.g. back button)
    useEffect(() => {
        setSearchTerm(defaultValue);
    }, [defaultValue]);

    // Create a query string with updated parameters
    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            // Reset page when searching
            params.delete("page");
            return params.toString();
        },
        [searchParams]
    );

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = searchParams.get("search") || "";
            if (searchTerm !== currentSearch) {
                router.push("?" + createQueryString("search", searchTerm));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, createQueryString, router, searchParams]);

    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            />
        </div>
    );
}

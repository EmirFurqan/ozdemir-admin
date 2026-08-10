"use client";

import { useState, useTransition } from "react";
import { toggleProductActiveStatusAction } from "@/app/actions/product";
import { Loader2 } from "lucide-react";

interface ProductStatusToggleProps {
    productId: number;
    initialActive: boolean;
}

export default function ProductStatusToggle({ productId, initialActive }: ProductStatusToggleProps) {
    const [active, setActive] = useState(initialActive);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        const nextState = !active;
        setActive(nextState); // optimistic update
        startTransition(async () => {
            const res = await toggleProductActiveStatusAction(productId, nextState);
            if (!res.success) {
                setActive(active); // revert on error
                alert(res.message || "Durum güncellenirken hata oluştu.");
            }
        });
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
            }`}
            title={active ? "Ürünü Pasif Yap" : "Ürünü Aktif Yap"}
        >
            {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
                <span className={`w-2 h-2 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
            )}
            <span>{active ? "Aktif" : "Pasif"}</span>
        </button>
    );
}

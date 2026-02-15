"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function DeleteButton() {
    const { pending } = useFormStatus();

    const handleClick = (e: React.MouseEvent) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) {
            e.preventDefault();
        }
    }

    return (
        <button
            type="submit"
            disabled={pending}
            onClick={handleClick}
            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    )
}

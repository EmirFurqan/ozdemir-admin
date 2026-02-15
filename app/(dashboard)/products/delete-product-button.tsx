'use client';

import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/app/actions/product";
import { useState } from "react";

export default function DeleteProductButton({ id, className }: { id: number, className?: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;

        setIsDeleting(true);
        try {
            const res = await deleteProduct(id);
            if (!res.success) {
                alert(res.message);
            }
        } catch (error) {
            console.error(error);
            alert("Silme işlemi başarısız.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Button
            size="icon"
            variant="ghost"
            className={`h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 ${className}`}
            onClick={handleDelete}
            disabled={isDeleting}
        >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
    );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteProductGroupAction } from "@/app/actions/productGroup";

interface GroupDeleteButtonProps {
    groupId: number;
    groupName: string;
    onDeleted?: () => void;
}

export default function GroupDeleteButton({ groupId, groupName, onDeleted }: GroupDeleteButtonProps) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        const confirmed = window.confirm(
            `"${groupName}" isimli ürün grubunu silmek istediğinizden emin misiniz?\n\nNOT: Grubun içindeki ürünler SİLİNMEYECEK, yalnızca grup bağları kaldırılacaktır.`
        );

        if (!confirmed) return;

        setDeleting(true);
        try {
            const res = await deleteProductGroupAction(groupId);
            if (res.success) {
                if (onDeleted) {
                    onDeleted();
                } else {
                    window.location.reload();
                }
            } else {
                alert(res.message || "Grup silinirken hata oluştu.");
            }
        } catch (e) {
            console.error(e);
            alert("Grup silinirken beklenmeyen bir hata oluştu.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="h-8 w-8 p-0 bg-white border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 cursor-pointer"
            title="Grubu Sil"
        >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Trash2 className="w-4 h-4" />}
        </Button>
    );
}

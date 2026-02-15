import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { brandService } from "@/app/services/brandService";
import { revalidatePath } from "next/cache";
import DeleteButton from "@/app/components/DeleteButton";
import { ImageWithFallback } from "@/app/components/ImageWithFallback";
import { DataTable, Column } from "@/app/components/DataTable";
import TableImage from "@/app/components/TableImage";

export const dynamic = "force-dynamic";

// Derive the API root URL by removing the '/api' suffix if present
const API_ROOT = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://127.0.0.1:8080";

export default async function BrandsPage() {
    const brands = await brandService.getBrands();

    async function deleteBrand(formData: FormData) {
        "use server";
        const id = formData.get("id");
        if (id) {
            await brandService.deleteBrand(Number(id));
            revalidatePath("/brands");
        }
    }

    const columns: Column<any>[] = [
        {
            header: "ID",
            accessorKey: "id",
            className: "w-20 font-medium text-slate-900"
        },
        {
            header: "Marka Adı",
            cell: (brand) => (
                <div className="flex items-center gap-3">
                    <TableImage
                        src={brand.logoName}
                        alt={brand.name}
                        fallbackText={brand.name}
                    />
                    <span className="truncate max-w-[200px] font-medium text-slate-900" title={brand.name}>{brand.name}</span>
                </div>
            )
        },
        {
            header: "Slug",
            cell: (brand) => (
                <span className="font-mono text-xs text-slate-500 bg-slate-50/50 rounded-lg w-fit px-2 py-1">{brand.slug}</span>
            )
        },
        {
            header: "İşlemler",
            className: "text-right",
            cell: (brand) => (
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                        href={`/brands/${brand.id}`}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
                        title="Düzenle"
                    >
                        <Edit className="w-4 h-4" />
                    </Link>
                    <form action={deleteBrand}>
                        <input type="hidden" name="id" value={brand.id} />
                        <DeleteButton />
                    </form>
                </div>
            )
        }
    ];

    const emptyState = (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <Plus className="w-6 h-6" />
            </div>
            <p className="font-medium text-slate-900">Henüz marka eklenmemiş</p>
            <p className="text-slate-500">Yeni bir marka ekleyerek başlayın.</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Markalar</h1>
                    <p className="text-slate-500 mt-1">Sistemdeki tüm markaları buradan yönetebilirsiniz.</p>
                </div>
                <Link
                    href="/brands/new"
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-red-200 hover:shadow-red-300"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Marka Ekle
                </Link>
            </div>

            <DataTable
                data={brands}
                columns={columns}
                keyExtractor={(item) => item.id}
                emptyMessage={emptyState}
            />
        </div>
    );
}

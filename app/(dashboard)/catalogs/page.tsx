import { catalogService, Catalog } from "@/app/services/catalogService";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, FileText, Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DeleteCatalogButton from "./delete-catalog-button";
import { DataTable, Column } from "@/app/components/DataTable";
import TableImage from "@/app/components/TableImage";

export const dynamic = 'force-dynamic';

export default async function CatalogsPage() {
    let catalogs: Catalog[] = [];

    try {
        catalogs = await catalogService.getAllCatalogs();
    } catch (error) {
        console.error("Failed to fetch catalogs", error);
    }

    const columns: Column<Catalog>[] = [
        {
            header: "Kapak",
            cell: (catalog) => (
                <TableImage
                    src={catalog.imgUrl}
                    alt={catalog.name}
                    fallbackText={catalog.name}
                />
            )
        },
        {
            header: "Katalog Adı",
            accessorKey: "name",
            className: "font-semibold text-slate-900"
        },
        {
            header: "Tür",
            cell: (catalog) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {catalog.type}
                </span>
            )
        },
        {
            header: "Yayın Tarihi",
            accessorKey: "releaseDate",
            className: "text-slate-600"
        },
        {
            header: "Açıklama",
            cell: (catalog) => (
                <div className="max-w-xs truncate text-slate-500">{catalog.description}</div>
            )
        },
        {
            header: "İşlemler",
            className: "text-right",
            cell: (catalog) => (
                <div className="flex justify-end gap-2">
                    <Link href={`/catalogs/${catalog.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50")}>
                        <Edit className="w-4 h-4" />
                    </Link>
                    <a
                        href={catalog.url.startsWith("http") ? catalog.url : `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || "http://127.0.0.1:8080"}${catalog.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-50")}
                    >
                        <Download className="w-4 h-4" />
                    </a>
                    <DeleteCatalogButton id={catalog.id} />
                </div>
            )
        }
    ];

    return (
        <div className="container mx-auto py-10 px-4" suppressHydrationWarning>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Katalog Yönetimi</h1>
                    <p className="text-slate-500">Katalogları ve fiyat listelerini yönetin.</p>
                </div>
                <Link href="/catalogs/new" className={cn(buttonVariants({ variant: "default" }), "bg-red-600 hover:bg-red-700")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Katalog Ekle
                </Link>
            </div>

            <DataTable
                data={catalogs}
                columns={columns}
                keyExtractor={(item) => item.id}
                emptyMessage="Henüz kayıtlı katalog bulunmamaktadır."
            />
        </div>
    );
}

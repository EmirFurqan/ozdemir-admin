import { productService, Product } from "@/app/services/productService";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2, ImageIcon, Package } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DeleteProductButton from "./delete-product-button";
import SearchBar from "@/app/components/SearchBar";
import Pagination from "@/app/components/Pagination";
import { DataTable, Column } from "@/app/components/DataTable";
import TableImage from "@/app/components/TableImage";

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; search?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 0;
    const search = params.search || "";

    let products: Product[] = [];
    let totalPages = 0;

    try {
        const data = await productService.getProducts({ page, size: 20, search });
        products = data.content;
        totalPages = data.totalPages;
    } catch (error) {
        console.error("Failed to fetch products", error);
    }

    const columns: Column<Product>[] = [
        {
            header: "Resim",
            cell: (product) => (
                <TableImage
                    src={product.imageUrl}
                    alt={product.code}
                />
            )
        },
        {
            header: "Kod",
            accessorKey: "code",
            className: "font-medium text-slate-700"
        },
        {
            header: "Ürün Adı",
            accessorKey: "name",
            className: "font-semibold text-slate-900"
        },
        {
            header: "Fiyat",
            cell: (product) => (
                <span className="text-slate-600">
                    {product.price} {product.currency}
                </span>
            )
        },
        {
            header: "Stok",
            cell: (product) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.stock} Adet
                </span>
            )
        },
        {
            header: "İşlemler",
            className: "text-right",
            cell: (product) => (
                <div className="flex justify-end gap-2">
                    <Link href={`/products/${product.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50")}>
                        <Edit className="w-4 h-4" />
                    </Link>
                    <DeleteProductButton id={Number(product.id)} />
                </div>
            )
        }
    ];

    const paginationContent = (
        <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/products"
            searchParams={{ search }}
        />
    );

    return (
        <div className="container mx-auto py-10 px-4" suppressHydrationWarning>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ürün Yönetimi</h1>
                    <p className="text-slate-500">Ürünleri listeleyin, ekleyin veya düzenleyin.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/products/group-manager" className={cn(buttonVariants({ variant: "outline" }), "border-slate-300 text-slate-700 hover:bg-slate-50")}>
                        <Package className="w-4 h-4 mr-2" />
                        Grup Yöneticisi
                    </Link>
                    <Link href="/products/new" className={cn(buttonVariants({ variant: "default" }), "bg-red-600 hover:bg-red-700")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Ürün Ekle
                    </Link>
                </div>
            </div>

            <DataTable
                data={products}
                columns={columns}
                keyExtractor={(item) => item.id}
                emptyMessage="Ürün bulunamadı."
                searchBar={<SearchBar defaultValue={search} placeholder="Ürün adı, kodu veya açıklama ara..." />}
                pagination={paginationContent}
            />
        </div>
    );
}

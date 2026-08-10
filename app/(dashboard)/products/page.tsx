import { productService, Product } from "@/app/services/productService";
import { brandService } from "@/app/services/brandService";
import { categoryService } from "@/app/services/categoryService";
import Link from "next/link";
import { Plus, Edit, Package, Layers } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DeleteProductButton from "./delete-product-button";
import ProductStatusToggle from "./product-status-toggle";
import Pagination from "@/app/components/Pagination";
import { DataTable, Column } from "@/app/components/DataTable";
import TableImage from "@/app/components/TableImage";
import ProductFilterBar from "@/app/components/ProductFilterBar";

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; search?: string; brandId?: string; categoryId?: string; active?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 0;
    const search = params.search || "";
    const brandId = params.brandId || "";
    const categoryId = params.categoryId || "";
    const active = params.active || "all";

    let products: Product[] = [];
    let totalPages = 0;
    let brands: any[] = [];
    let categories: any[] = [];

    try {
        const [productsData, brandsData, categoriesData] = await Promise.all([
            productService.getProducts({ page, size: 25, search, brandId, categoryId, grouped: false, active }),
            brandService.getBrands().catch(() => []),
            categoryService.getCategories({ size: 500 }).then(res => res.content || res).catch(() => [])
        ]);

        products = productsData.content || [];
        totalPages = productsData.totalPages || 0;
        brands = Array.isArray(brandsData) ? brandsData : [];
        categories = Array.isArray(categoriesData) ? categoriesData : [];
    } catch (error) {
        console.error("Failed to fetch products or metadata", error);
    }

    const columns: Column<Product>[] = [
        {
            header: "Resim",
            cell: (product) => (
                <TableImage
                    src={product.imageUrl}
                    alt={product.code || product.name}
                />
            )
        },
        {
            header: "Kod",
            cell: (product) => (
                <div className="space-y-1">
                    <div className="font-mono text-xs font-semibold text-slate-800">
                        {product.code || "-"}
                    </div>
                    {product.groupCode && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <Layers className="w-2.5 h-2.5 mr-1" />
                            {product.groupCode}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: "Ürün Adı",
            cell: (product) => (
                <div className="max-w-md font-semibold text-slate-900 line-clamp-2">
                    {product.name}
                </div>
            )
        },
        {
            header: "Durum",
            cell: (product) => (
                <ProductStatusToggle productId={Number(product.id)} initialActive={product.active !== false} />
            )
        },
        {
            header: "Marka",
            cell: (product) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    {product.brand?.name || "-"}
                </span>
            )
        },
        {
            header: "Kategori",
            cell: (product) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {product.category?.name || "-"}
                </span>
            )
        },
        {
            header: "Fiyat",
            cell: (product) => (
                <span className="text-slate-700 font-medium">
                    {product.price ? `${product.price} ${product.currency || ''}` : "-"}
                </span>
            )
        },
        {
            header: "Stok",
            cell: (product) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.stock ?? 0} Adet
                </span>
            )
        },
        {
            header: "İşlemler",
            className: "text-right",
            cell: (product) => (
                <div className="flex justify-end gap-2">
                    <Link
                        href={`/products/${product.id}`}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50")}
                        title="Düzenle"
                    >
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
            searchParams={{
                search,
                brandId,
                categoryId,
                active
            }}
        />
    );

    return (
        <div className="container mx-auto py-10 px-4" suppressHydrationWarning>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ürün Yönetimi</h1>
                    <p className="text-slate-500 mt-1">
                        Tüm münferit ürünleri tek tek listeleyin, düzenleyin ve fiyat/stok yönetimi yapın.
                    </p>
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

            <ProductFilterBar brands={brands} categories={categories} />

            <DataTable
                data={products}
                columns={columns}
                keyExtractor={(item) => item.id}
                emptyMessage="Filtrelere uygun ürün bulunamadı."
                pagination={paginationContent}
            />
        </div>
    );
}

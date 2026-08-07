import { productService, Product } from "@/app/services/productService";
import { brandService } from "@/app/services/brandService";
import { categoryService } from "@/app/services/categoryService";
import Link from "next/link";
import { Plus, Edit, Package, Layers } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DeleteProductButton from "./delete-product-button";
import Pagination from "@/app/components/Pagination";
import { DataTable, Column } from "@/app/components/DataTable";
import TableImage from "@/app/components/TableImage";
import ProductFilterBar from "@/app/components/ProductFilterBar";

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; search?: string; brandId?: string; categoryId?: string; grouped?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 0;
    const search = params.search || "";
    const brandId = params.brandId || "";
    const categoryId = params.categoryId || "";
    const grouped = params.grouped !== "false";

    let products: Product[] = [];
    let totalPages = 0;
    let brands: any[] = [];
    let categories: any[] = [];

    try {
        const [productsData, brandsData, categoriesData] = await Promise.all([
            productService.getProducts({ page, size: 20, search, brandId, categoryId, grouped }),
            brandService.getBrands().catch(() => []),
            categoryService.getCategories().then(res => res.content || res).catch(() => [])
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
            header: "Kod / Grup No",
            cell: (product) => {
                if (product.groupCode) {
                    return (
                        <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <Layers className="w-3 h-3 mr-1" />
                                {product.groupCode}
                            </span>
                            {product.code && (
                                <div className="text-[11px] text-slate-400 font-mono">{product.code}</div>
                            )}
                        </div>
                    );
                }
                return (
                    <span className="font-mono text-xs font-medium text-slate-700">
                        {product.code || "-"}
                    </span>
                );
            }
        },
        {
            header: "Ürün Adı",
            cell: (product) => (
                <div className="max-w-md">
                    <div className="font-semibold text-slate-900 line-clamp-2">
                        {product.groupName || product.name}
                    </div>
                    {product.groupCode && (
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Gruplu Ürün Serisi
                        </span>
                    )}
                </div>
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
                grouped: grouped ? "true" : "false"
            }}
        />
    );

    return (
        <div className="container mx-auto py-10 px-4" suppressHydrationWarning>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ürün Yönetimi</h1>
                    <p className="text-slate-500 mt-1">
                        Tüm ürünleri ve ürün gruplarını sınıflandırın, listeleyin ve yönetin.
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

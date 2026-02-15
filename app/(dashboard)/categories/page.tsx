import Link from "next/link";
import { Plus, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { categoryService, Category } from "@/app/services/categoryService";
import { revalidatePath } from "next/cache";
import DeleteButton from "@/app/components/DeleteButton";
import { ImageWithFallback } from "@/app/components/ImageWithFallback";
import CategoryFilters from "./CategoryFilters";
import { brandService } from "@/app/services/brandService";
import { DataTable, Column } from "@/app/components/DataTable";
import Pagination from "@/app/components/Pagination";
import TableImage from "@/app/components/TableImage";
import SearchBar from "@/app/components/SearchBar";

export const dynamic = "force-dynamic";

// Derive the API root URL by removing the '/api' suffix if present
const API_ROOT = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://127.0.0.1:8080";

export default async function CategoriesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    // Await searchParams as it is a Promise in Next.js 15+
    const resolvedSearchParams = await props.searchParams;

    const search = Array.isArray(resolvedSearchParams?.search) ? resolvedSearchParams.search[0] : resolvedSearchParams?.search;

    let brandId: number | undefined = undefined;
    if (resolvedSearchParams?.brandId) {
        const bid = Array.isArray(resolvedSearchParams.brandId) ? resolvedSearchParams.brandId[0] : resolvedSearchParams.brandId;
        if (bid) brandId = Number(bid);
    }

    const sortBy = Array.isArray(resolvedSearchParams?.sortBy) ? resolvedSearchParams.sortBy[0] : resolvedSearchParams?.sortBy;
    const order = Array.isArray(resolvedSearchParams?.order) ? resolvedSearchParams.order[0] : resolvedSearchParams?.order;

    // Pagination params
    const page = resolvedSearchParams?.page ? Number(Array.isArray(resolvedSearchParams.page) ? resolvedSearchParams.page[0] : resolvedSearchParams.page) : 0;
    const size = resolvedSearchParams?.size ? Number(Array.isArray(resolvedSearchParams.size) ? resolvedSearchParams.size[0] : resolvedSearchParams.size) : 10;

    const [categoriesPage, brands] = await Promise.all([
        categoryService.getCategories({ search, brandId, sortBy, order, page, size }),
        brandService.getBrands()
    ]);

    // Extract content from page object
    const categories = categoriesPage.content;
    const totalPages = categoriesPage.totalPages;

    async function deleteCategory(formData: FormData) {
        "use server";
        const id = formData.get("id");
        if (id) {
            await categoryService.deleteCategory(Number(id));
            revalidatePath("/categories");
        }
    }

    // Helper to toggle sort order
    const getSortLink = (field: string) => {
        const newOrder = sortBy === field && order === "asc" ? "desc" : "asc";
        const params = new URLSearchParams();

        Object.entries(resolvedSearchParams).forEach(([key, value]) => {
            if (value !== undefined && key !== "page") { // Reset page on sort
                params.append(key, Array.isArray(value) ? value[0] : value);
            }
        });

        params.set("sortBy", field);
        params.set("order", newOrder);
        return `/categories?${params.toString()}`;
    };

    // Helper for pagination links
    const getPageLink = (newPage: number) => {
        const params = new URLSearchParams();
        Object.entries(resolvedSearchParams).forEach(([key, value]) => {
            if (value !== undefined) {
                params.append(key, Array.isArray(value) ? value[0] : value);
            }
        });
        params.set("page", newPage.toString());
        return `/categories?${params.toString()}`;
    };

    const columns: Column<Category>[] = [
        {
            header: (
                <Link href={getSortLink("id")} className="flex items-center gap-1 hover:text-red-600">
                    ID {sortBy === "id" && <span>{order === "asc" ? "↑" : "↓"}</span>}
                </Link>
            ),
            accessorKey: "id",
            className: "w-20 font-medium text-slate-900"
        },
        {
            header: (
                <Link href={getSortLink("name")} className="flex items-center gap-1 hover:text-red-600">
                    Kategori Adı {sortBy === "name" && <span>{order === "asc" ? "↑" : "↓"}</span>}
                </Link>
            ),
            cell: (cat) => (
                <div className="flex items-center gap-3">
                    <TableImage
                        src={cat.imageUrl}
                        alt={cat.name}
                        fallbackText={cat.name}
                    />
                    <div className="flex flex-col">
                        <span className="truncate max-w-[200px] font-medium text-slate-900" title={cat.name}>{cat.name}</span>
                        {cat.brand && <span className="text-xs text-slate-400">{cat.brand.name}</span>}
                    </div>
                </div>
            )
        },
        {
            header: "Slug",
            cell: (cat) => (
                <span className="font-mono text-xs text-slate-500 bg-slate-50/50 rounded-lg w-fit px-2 py-1">{cat.slug}</span>
            )
        },
        {
            header: "İşlemler",
            className: "text-right",
            cell: (cat) => (
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                        href={`/categories/${cat.id}`}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
                        title="Düzenle"
                    >
                        <Edit className="w-4 h-4" />
                    </Link>
                    <form action={deleteCategory}>
                        <input type="hidden" name="id" value={cat.id} />
                        <DeleteButton />
                    </form>
                </div>
            )
        }
    ];

    const paginationContent = (
        <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/categories"
            searchParams={{
                search,
                brandId: brandId?.toString(),
                sortBy,
                order
            }}
        />
    );

    const emptyState = (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <Plus className="w-6 h-6" />
            </div>
            <p className="font-medium text-slate-900">Sonuç bulunamadı</p>
            <p className="text-slate-500">Arama kriterlerinizi değiştirerek tekrar deneyin.</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Kategoriler</h1>
                    <p className="text-slate-500 mt-1">Sistemdeki ürün kategorilerini buradan yönetebilirsiniz.</p>
                </div>
                <Link
                    href="/categories/new"
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-red-200 hover:shadow-red-300"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Kategori Ekle
                </Link>
            </div>

            <DataTable
                data={categories}
                columns={columns}
                keyExtractor={(item) => item.id}
                emptyMessage={emptyState}
                pagination={paginationContent}
                className="rounded-2xl border-slate-200"
                searchBar={<SearchBar defaultValue={search} placeholder="Kategori Ara..." />}
                filters={
                    <CategoryFilters
                        brands={brands}
                        initialBrandId={brandId?.toString()}
                    />
                }
            />
        </div>
    );
}

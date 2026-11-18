import { categoryService, Category } from "@/app/services/categoryService";
import { brandService, Brands } from "@/app/services/brandService";
import CategoryBrandManager from "./CategoryBrandManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedSearchParams = await props.searchParams;

    let initialBrandId: number | undefined = undefined;
    if (resolvedSearchParams?.brandId) {
        const bid = Array.isArray(resolvedSearchParams.brandId)
            ? resolvedSearchParams.brandId[0]
            : resolvedSearchParams.brandId;
        if (bid && !isNaN(Number(bid))) {
            initialBrandId = Number(bid);
        }
    }

    const [categoriesPage, brandsData] = await Promise.all([
        categoryService.getCategories({ page: 0, size: 1000 }).catch(() => ({
            content: [] as Category[],
            totalPages: 0,
            totalElements: 0,
            size: 1000,
            number: 0,
            first: true,
            last: true,
            empty: true,
        })),
        brandService.getBrands().catch(() => [] as Brands[]),
    ]);

    const rawBrands: Brands[] = Array.isArray(brandsData) ? brandsData : [];
    const rawCategories: Category[] = Array.isArray(categoriesPage?.content)
        ? categoriesPage.content
        : [];

    // Sort brands and categories by displayOrder (ascending), fallback to id
    const sortedBrands = [...rawBrands].sort((a, b) => {
        const orderA = a.displayOrder && a.displayOrder > 0 ? a.displayOrder : 999999;
        const orderB = b.displayOrder && b.displayOrder > 0 ? b.displayOrder : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return a.id - b.id;
    });

    const sortedCategories = [...rawCategories].sort((a, b) => {
        const orderA = a.displayOrder && a.displayOrder > 0 ? a.displayOrder : 999999;
        const orderB = b.displayOrder && b.displayOrder > 0 ? b.displayOrder : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return a.id - b.id;
    });

    return (
        <CategoryBrandManager
            initialBrands={sortedBrands}
            initialCategories={sortedCategories}
            initialSelectedBrandId={initialBrandId}
        />
    );
}

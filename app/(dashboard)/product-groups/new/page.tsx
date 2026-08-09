import { brandService } from "@/app/services/brandService";
import { categoryService } from "@/app/services/categoryService";
import ProductGroupEditor from "../ProductGroupEditor";

export const dynamic = 'force-dynamic';

export default async function NewProductGroupPage() {
    const [brandsData, categoriesData] = await Promise.all([
        brandService.getBrands().catch(() => []),
        categoryService.getCategories({ size: 500 }).then(res => res.content || res).catch(() => [])
    ]);

    const brands = Array.isArray(brandsData) ? brandsData : [];
    const categories = Array.isArray(categoriesData) ? categoriesData : [];

    return (
        <div className="container mx-auto py-8 px-4">
            <ProductGroupEditor
                group={null}
                groupId={0}
                products={[]}
                allProducts={[]}
                brands={brands}
                categories={categories}
            />
        </div>
    );
}

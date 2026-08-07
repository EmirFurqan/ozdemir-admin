import { getProductGroupById, getGroupProducts } from "@/app/actions/productGroup";
import { brandService } from "@/app/services/brandService";
import { categoryService } from "@/app/services/categoryService";
import ProductGroupEditor from "../ProductGroupEditor";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditProductGroupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const groupId = parseInt(id, 10);

    // Fetch group, group products, brands, and categories in parallel for fast page render
    const [group, groupProducts, brandsData, categoriesData] = await Promise.all([
        getProductGroupById(groupId),
        getGroupProducts(groupId),
        brandService.getBrands().catch(() => []),
        categoryService.getCategories({ size: 500 }).then(res => res.content || res).catch(() => [])
    ]);

    if (!group) {
        notFound();
    }

    const brands = Array.isArray(brandsData) ? brandsData : [];
    const categories = Array.isArray(categoriesData) ? categoriesData : [];

    return (
        <div className="container mx-auto py-8 px-4">
            <ProductGroupEditor
                group={group}
                groupId={groupId}
                products={groupProducts}
                allProducts={[]}
                brands={brands}
                categories={categories}
            />
        </div>
    );
}

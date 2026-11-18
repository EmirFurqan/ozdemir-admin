import { getProductGroupById, getGroupProducts } from "@/app/actions/productGroup";
import { fetchAPI } from "@/app/lib/api";
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

    // Ensure documents are populated from the first product if not already in groupProducts
    if (groupProducts && groupProducts.length > 0 && (!groupProducts[0].documents || groupProducts[0].documents.length === 0)) {
        try {
            const firstProduct = await fetchAPI(`/products/${groupProducts[0].id}`);
            if (firstProduct?.documents && firstProduct.documents.length > 0) {
                groupProducts[0].documents = firstProduct.documents;
            }
        } catch (e) {
            // Ignore if fails
        }
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

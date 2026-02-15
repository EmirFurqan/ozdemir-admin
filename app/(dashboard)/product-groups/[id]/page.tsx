
import { getProductGroupById, getGroupProducts } from "@/app/actions/productGroup";
import { productService } from "@/app/services/productService";
import ProductGroupForm from "../ProductGroupForm";
import ProductGroupProductsManager from "../ProductGroupProductsManager";
import { notFound } from "next/navigation";

export default async function EditProductGroupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const groupId = parseInt(id);

    // Fetch data in parallel
    const [group, groupProducts, allProductsRes] = await Promise.all([
        getProductGroupById(groupId),
        getGroupProducts(groupId),
        productService.getProducts({ size: 1000 }) // Fetch reasonable amount of products for selection
    ]);

    if (!group) {
        notFound();
    }

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <h1 className="text-2xl font-bold mb-8 text-center">Ürün Grubu Düzenle</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Group Details Form */}
                <div className="lg:col-span-1">
                    <ProductGroupForm group={group} />
                </div>

                {/* Right Column: Products Manager */}
                <div className="lg:col-span-2">
                    <ProductGroupProductsManager
                        groupId={groupId}
                        products={groupProducts}
                        allProducts={allProductsRes.content}
                    />
                </div>
            </div>
        </div>
    );
}

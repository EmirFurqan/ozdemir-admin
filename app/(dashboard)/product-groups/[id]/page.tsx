import { getProductGroupById, getGroupProducts } from "@/app/actions/productGroup";
import { productService } from "@/app/services/productService";
import ProductGroupEditor from "../ProductGroupEditor";
import { notFound } from "next/navigation";

export default async function EditProductGroupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const groupId = parseInt(id, 10);

    // Fetch data in parallel
    // Fetch group & group products in parallel for fast page render
    const [group, groupProducts] = await Promise.all([
        getProductGroupById(groupId),
        getGroupProducts(groupId)
    ]);

    if (!group) {
        notFound();
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <ProductGroupEditor
                group={group}
                groupId={groupId}
                products={groupProducts}
                allProducts={[]}
            />
        </div>
    );
}

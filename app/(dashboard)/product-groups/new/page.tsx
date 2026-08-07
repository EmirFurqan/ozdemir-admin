import { brandService } from "@/app/services/brandService";
import { categoryService } from "@/app/services/categoryService";
import CreateGroupForm from "../CreateGroupForm";

export const dynamic = 'force-dynamic';

export default async function NewProductGroupPage() {
    const [brandsData, categoriesData] = await Promise.all([
        brandService.getBrands().catch(() => []),
        categoryService.getCategories({ size: 500 }).then(res => res.content || res).catch(() => [])
    ]);

    const brands = Array.isArray(brandsData) ? brandsData : [];
    const categories = Array.isArray(categoriesData) ? categoriesData : [];

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-2xl font-bold mb-8 text-center">Yeni Ürün Grubu Ekle</h1>
            <CreateGroupForm allProducts={[]} brands={brands} categories={categories} />
        </div>
    );
}

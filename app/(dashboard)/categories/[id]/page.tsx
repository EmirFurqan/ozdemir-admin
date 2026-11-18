import { categoryService } from "@/app/services/categoryService";
import { brandService } from "@/app/services/brandService";
import CategoryForm from "../CategoryForm";

export default async function EditCategoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ brandId?: string }>;
}) {
    const { id } = await params;
    const resolvedSearch = searchParams ? await searchParams : {};
    const defaultBrandId = resolvedSearch?.brandId || "";
    let category = null;
    const brands = await brandService.getBrands();

    if (id !== "new") {
        category = await categoryService.getCategoryById(Number(id));
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{id === "new" ? "Yeni Kategori Ekle" : "Kategoriyi Düzenle"}</h1>
            </div>
            <CategoryForm category={category} brands={brands} defaultBrandId={defaultBrandId} key={id} />
        </div>
    );
}

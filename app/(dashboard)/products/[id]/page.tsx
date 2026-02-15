import { productService } from "@/app/services/productService";
import { brandService } from "@/app/services/brandService";
import { categoryService } from "@/app/services/categoryService";
import { productGroupService } from "@/app/services/productGroupService";
import ProductForm from "../ProductForm";
import ProductEditForm from "../ProductEditForm";

export default async function EditProductPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ groupId?: string; variantLabel?: string }>
}) {
    const { id } = await params;
    const { groupId, variantLabel } = await searchParams;

    const isNew = id === 'new';
    let product = null;

    // Fetch master data in parallel
    const [brands, categoriesResponse, productGroups] = await Promise.all([
        brandService.getBrands(),
        categoryService.getCategories({ size: 100 }), // Get all categories for dropdown
        productGroupService.getProductGroups()
    ]);

    // Handle paginated response
    const categories = (categoriesResponse as any).content || [];

    if (!isNew) {
        try {
            product = await productService.getProductById(Number(id));
        } catch (e) {
            console.error("Product not found", e);
        }
    }

    if (!isNew && !product) {
        return (
            <div className="container mx-auto py-10 px-4 flex flex-col items-center justify-center min-h-[50vh]">
                <h1 className="text-2xl font-bold mb-4 text-slate-800">Ürün Bulunamadı</h1>
                <p className="text-slate-500 mb-6">Aradığınız ürün silinmiş veya mevcut değil.</p>
                <a href="/products" className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors">
                    Ürün Listesine Dön
                </a>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-2xl font-bold mb-8">{isNew ? "Yeni Ürün Ekle" : "Ürünü Düzenle"}</h1>
            {isNew ? (
                <ProductForm
                    product={product}
                    brands={brands}
                    categories={categories}
                    key={id}
                    initialGroupId={groupId}
                    initialVariantLabel={variantLabel}
                />
            ) : (
                <ProductEditForm product={product} brands={brands} categories={categories} productGroups={productGroups} key={id} />
            )}
        </div>
    );
}

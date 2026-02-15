'use server'

import { fetchAPI } from "@/app/lib/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getProductsForSelect() {
    try {
        // Fetch a large page to get most products. 
        // Ideally backend should support "select" projection or we map it here.
        const res = await fetchAPI("/products?page=0&size=2000&grouped=false");
        const products = res.content || [];

        // Map to lightweight object
        return products.map((p: any) => ({
            id: p.id,
            code: p.code,
            name: p.name
        }));
    } catch (error) {
        console.error("Failed to fetch products for select:", error);
        return [];
    }
}

export async function saveProduct(prevState: any, formData: FormData) {
    const id = formData.get("id");
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const price = formData.get("price") as string;
    const stock = formData.get("stock") as string;
    const description = formData.get("description") as string;
    const currency = formData.get("currency") as string;
    const vatRate = formData.get("vatRate") as string;
    const logoLogicalRef = formData.get("logoLogicalRef") as string;
    const brandId = formData.get("brandId") as string;
    const categoryId = formData.get("categoryId") as string;

    // Variant fields
    const hasVariants = formData.get("hasVariants") === "true";
    const groupCode = formData.get("groupCode") as string;
    const mainVariantLabel = formData.get("mainVariantLabel") as string;
    const newVariantsJson = formData.get("newVariants") as string;

    // Features
    const featuresJson = formData.get("features") as string;
    let features = [];
    if (featuresJson) {
        features = JSON.parse(featuresJson);
    }

    // Images
    const uploadedImagesJson = formData.get("uploadedImages") as string;
    let images = [];
    if (uploadedImagesJson) {
        images = JSON.parse(uploadedImagesJson);
    }

    // Documents
    const documentsJson = formData.get("documents") as string;
    let documents = [];
    if (documentsJson) {
        documents = JSON.parse(documentsJson);
    }

    const baseProductData = {
        name,
        code,
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        description,
        currencyId: parseInt(currency) || 0,
        vatRate: parseFloat(vatRate) || 20,
        logoLogicalRef: logoLogicalRef ? parseInt(logoLogicalRef) : null,
        brand: brandId ? { id: parseInt(brandId) } : null,
        category: categoryId ? { id: parseInt(categoryId) } : null,
        images: images,
        documents: documents,
        features: features
    };

    try {
        let groupId = null;

        // 1. Handle Group Logic
        if (formData.get("existingGroupId")) {
            groupId = parseInt(formData.get("existingGroupId") as string);
        } else if (groupCode) {
            try {
                // Try to find existing group first
                const groups = await fetchAPI("/product-groups");
                const existing = groups.find((g: any) => g.groupCode === groupCode);

                if (existing) {
                    groupId = existing.id;
                } else if (hasVariants) {
                    // Only create new group if we are explicitly setting up variants
                    const groupRes = await fetchAPI("/product-groups", {
                        method: "POST",
                        body: JSON.stringify({
                            groupCode: groupCode,
                            name: name + " Grubu"
                        })
                    });
                    if (groupRes && groupRes.id) {
                        groupId = groupRes.id;
                    }
                }
            } catch (e) {
                console.error("Group linking error:", e);
            }
        }

        // 2. Save Main Product
        const mainProductData = {
            ...baseProductData,
            variantLabel: mainVariantLabel,
            group: groupId ? { id: groupId } : null
        };

        const mainMethod = (id && id !== "new") ? "PUT" : "POST";
        const mainUrl = (id && id !== "new") ? `/products/${id}` : "/products";

        const savedMain = await fetchAPI(mainUrl, {
            method: mainMethod,
            body: JSON.stringify(mainProductData),
        });

        // 3. Save New Variants
        if (hasVariants && newVariantsJson) {
            const parsedVariants = JSON.parse(newVariantsJson);
            for (const v of parsedVariants) {
                if (!v.code) continue;

                const variantData = {
                    ...baseProductData,
                    name: baseProductData.name,
                    code: v.code,
                    price: parseFloat(v.price) || baseProductData.price,
                    stock: parseInt(v.stock) || 0,
                    variantLabel: v.label,
                    logoLogicalRef: v.logoLogicalRef ? parseInt(v.logoLogicalRef) : null,
                    group: groupId ? { id: groupId } : null,
                    images: images // Variant products usually share images? 
                    // Current backend logic "populate shared assets" relies on group. 
                    // If we save images to variants, they duplicate.
                    // If we DON'T save images to variants, the backend "Smart Fallback" will use main product (if in same group) images.
                    // Ideally, don't duplicate images in DB.
                    // So let's NOT send images for variants here, relying on fallback.
                };
                // Remove images from variant creation to avoid duplication
                delete variantData.images;

                await fetchAPI("/products", {
                    method: "POST",
                    body: JSON.stringify(variantData)
                });
            }
        }

        revalidatePath("/products");
    } catch (error) {
        console.error("Failed to save product:", error);
        return { success: false, message: "Ürün kaydedilemedi: " + (error as Error).message };
    }

    redirect("/products");
}

export async function deleteProduct(id: number) {
    try {
        await fetchAPI(`/products/${id}`, {
            method: "DELETE",
        });
        revalidatePath("/products");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete product:", error);
        return { success: false, message: "Ürün silinemedi." };
    }
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fetchAPI } from "@/app/lib/api";

export async function getProductGroups() {
    try {
        return await fetchAPI("/product-groups");
    } catch (error) {
        console.error("Failed to fetch product groups:", error);
        return [];
    }
}

export async function getProductGroupById(id: number) {
    try {
        return await fetchAPI(`/product-groups/${id}`);
    } catch (error) {
        console.error(`Failed to fetch product group ${id}:`, error);
        return null;
    }
}

export async function getGroupProducts(id: number) {
    try {
        return await fetchAPI(`/product-groups/${id}/products`);
    } catch (error) {
        console.error(`Failed to fetch group products ${id}:`, error);
        return [];
    }
}

export async function saveProductGroup(prevState: any, formData: FormData) {
    const id = formData.get("id");
    const groupCode = formData.get("groupCode");
    const name = formData.get("name");

    const payload = {
        groupCode,
        name
    };

    try {
        if (id) {
            await fetchAPI(`/product-groups/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        } else {
            await fetchAPI("/product-groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        }
    } catch (error) {
        console.error("Failed to save product group:", error);
        return { message: "Grup kaydedilirken hata oluştu." };
    }

    revalidatePath("/product-groups");
    redirect("/product-groups");
}

export async function addProductToGroup(groupId: number, productId: number, variantLabel: string) {
    // We can use bulk-assign for this as it handles mapping logic
    // Or we can update the product directly.
    // Let's use bulk-assign format to be safe as it's built for group assignment logic

    // Actually, bulk-assign requires groupCode. If we have ID, we might need to look it up or pass groupCode.
    // Alternatively, since we are in admin app, we can just update the product to set its group.
    // BUT product update endpoint might reset other fields or expect full object.

    // Let's check fetchAPI implementation in action/product.ts...
    // It seems updating a product requires full object in Spring Boot usually if @RequestBody Product is used.
    // However, we can use the bulk-assign endpoint which is designed for this connection.

    try {
        // We need group info first to get code
        const group = await getProductGroupById(groupId);
        if (!group) throw new Error("Group not found");

        const payload = {
            groupCode: group.groupCode,
            groupName: group.name,
            products: [
                {
                    productId: productId,
                    variantLabel: variantLabel
                }
            ]
        };

        await fetchAPI("/product-groups/bulk-assign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        revalidatePath(`/product-groups/${groupId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to add product to group:", error);
        return { success: false, message: "Ürün gruba eklenemedi." };
    }
}

export async function createProductGroupWithProducts(prevState: any, formData: FormData) {
    const groupCode = formData.get("groupCode") as string;
    const groupName = formData.get("name") as string;
    const productsJson = formData.get("products") as string;

    if (!groupCode || !groupName) {
        return { success: false, message: "Grup kodu ve adı zorunludur." };
    }

    try {
        const products = JSON.parse(productsJson || "[]");

        if (products.length === 0) {
            // No products, use standard create
            await fetchAPI("/product-groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    groupCode,
                    name: groupName
                }),
            });
        } else {
            // Have products, use bulk assign
            const payload = {
                groupCode,
                groupName,
                products: products.map((p: any) => ({
                    productId: p.id,
                    variantLabel: p.variantLabel
                }))
            };

            await fetchAPI("/product-groups/bulk-assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        }

    } catch (error) {
        console.error("Failed to create group with products:", error);
        return { success: false, message: "Grup oluşturulurken hata oluştu." };
    }

    revalidatePath("/product-groups");
    redirect("/product-groups");
}

export async function removeProductFromGroup(productId: number) {
    try {
        // 1. Fetch current product to ensure we allow partial updates or full update without data loss
        // Since update endpoint overwrites fields with null if missing, we must fetch full object first.
        const product = await fetchAPI(`/products/${productId}`);

        if (!product) {
            return { success: false, message: "Ürün bulunamadı." };
        }

        // 2. Remove group association
        // We set group to null. 
        // Note: functionality depends on backend accepting partial/full update and handling null group correctly.
        // Based on analysis, setGroup(null) clears the list.
        const updatedProduct = {
            ...product,
            group: null,
            // Ensure we don't send readonly fields/variants that might confuse backend?
            // Backend ignores ignored properties.
            // 'variants' is transient, so it won't be mapped to entity fields.
        };

        // 3. Send Update
        await fetchAPI(`/products/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedProduct),
        });

        revalidatePath("/product-groups");
        return { success: true };
    } catch (error) {
        console.error("Failed to remove product from group:", error);
        return { success: false, message: "Ürün gruptan çıkarılamadı." };
    }
}

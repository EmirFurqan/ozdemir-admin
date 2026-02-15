'use server'

import { fetchAPI } from "@/app/lib/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { categoryService } from "../services/categoryService";

export async function saveCategory(prevState: any, formData: FormData) {
    const id = formData.get("id");
    const name = formData.get("name") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const brandId = formData.get("brandId") as string;

    const data: any = {
        name,
        imageUrl,
    };

    if (brandId) {
        data.brand = { id: Number(brandId) };
    }

    try {
        if (id && id !== "new") {
            await categoryService.updateCategory(Number(id), data);
        } else {
            await categoryService.createCategory(data);
        }
        revalidatePath("/categories");
    } catch (error) {
        console.error("Failed to save category:", error);
        return { success: false, message: "Kategori kaydedilemedi." };
    }

    redirect("/categories");
}

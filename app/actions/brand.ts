'use server'

import { fetchAPI } from "@/app/lib/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { brandService } from "../services/brandService";

export async function saveBrand(prevState: any, formData: FormData) {
    const id = formData.get("id");
    const name = formData.get("name") as string;
    const logoName = formData.get("logoName") as string;
    const description = formData.get("description") as string;
    const displayOrderRaw = formData.get("displayOrder") as string;

    const data: any = {
        name,
        logoName,
        description,
    };

    if (displayOrderRaw && !isNaN(Number(displayOrderRaw)) && Number(displayOrderRaw) > 0) {
        data.displayOrder = Number(displayOrderRaw);
    }

    try {
        if (id && id !== "new") {
            await brandService.updateBrand(Number(id), data);
        } else {
            await brandService.createBrand(data);
        }
        revalidatePath("/brands");
    } catch (error) {
        console.error("Failed to save brand:", error);
        return { success: false, message: "Marka kaydedilemedi." };
    }

    redirect("/brands");
}

export async function reorderBrandsAction(brandIds: number[]) {
    try {
        await brandService.reorderBrands(brandIds);
        revalidatePath("/brands");
        revalidatePath("/categories");
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder brands:", error);
        return { success: false, message: "Marka sıralaması kaydedilemedi." };
    }
}

export async function deleteBrandAction(id: number) {
    try {
        await brandService.deleteBrand(id);
        revalidatePath("/brands");
        revalidatePath("/categories");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete brand:", error);
        return { success: false, message: "Marka silinemedi." };
    }
}

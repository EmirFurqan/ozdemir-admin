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

    const data = {
        name,
        logoName,
        description,
    };

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

import { fetchAPI } from "../lib/api";

export interface Brands {
    id: number;
    name: string;
    logoName: string;
    logoUrl: string;
    description: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    imageUrl?: string;
}

export const brandService = {
    getBrands: async () => {
        return fetchAPI("/brands", { cache: "no-store" });
    },
    getBrandBySlug: async (slug: string) => {
        return fetchAPI(`/brands/${slug}`);
    },
    getCategories: async (slug: string) => {
        return fetchAPI(`/brands/${slug}/categories`);
    },
    // Keep getBrandById...
    getBrandById: async (id: number) => {
        const brands = await fetchAPI("/brands", { cache: "no-store" });
        return brands.find((b: any) => b.id.toString() === id.toString());
    },
    createBrand: async (data: Partial<Brands>) => {
        return fetchAPI("/brands", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    updateBrand: async (id: number, data: Partial<Brands>) => {
        return fetchAPI(`/brands/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },
    deleteBrand: async (id: number) => {
        return fetchAPI(`/brands/${id}`, {
            method: "DELETE",
        });
    },
    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        // We use fetch directly here because our fetchAPI helper might default to JSON headers
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
            method: "POST",
            body: formData,
            // Content-Type header not set manually to let browser set multipart boundary
        });

        if (!response.ok) {
            throw new Error("Upload failed");
        }
        return response.json();
    },
};

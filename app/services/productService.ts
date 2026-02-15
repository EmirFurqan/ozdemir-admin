import { fetchAPI } from "../lib/api";

export interface ProductImage {
    id: number;
    url: string;
    isMain: boolean;
    displayOrder: number;
}

export interface ProductDocument {
    id: number;
    name: string;
    url: string;
    type: string;
}

export interface Product {
    id: number;
    name: string;
    code: string;
    slug: string;
    description?: string;
    groupName?: string;
    imageUrl?: string;
    images?: ProductImage[];
    documents?: ProductDocument[];
    variants?: { id: string; slug: string; label: string; active: string; code: string; price: string; stock: string }[];
    variantLabel?: string;
    price: number; // Will be hidden in UI for corporate
    currency: number; // This is actually string symbol from backend, kept for compatibility? Or maybe it's just currencyId?
    currencyId?: number; // Added from backend
    stock: number;
    vatRate?: number;
    logoLogicalRef?: number;
    brand?: { id: number; name: string };
    category?: { id: number; name: string };
    features?: { id: number; feature: string; description: string; displayOrder: number }[];
}

export const productService = {
    getProducts: async ({ page = 0, size = 10, search = "", brandId = null, categoryId = null } = {}) => {
        const query = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
            grouped: "false",
        });
        if (search) query.append("search", search);
        if (brandId) query.append("brandId", brandId);
        if (categoryId) query.append("categoryId", categoryId);

        return fetchAPI(`/products?${query.toString()}`);
    },

    getFeaturedProducts: async () => {
        // Fetch first 3 products as featured for now
        const data = await fetchAPI("/products?page=0&size=3");
        return data.content as Product[];
    },

    bulkAssignToGroup: async (groupCode: string, groupName: string, products: any[]) => {
        return fetchAPI("/product-groups/bulk-assign", {
            method: "POST",
            body: JSON.stringify({ groupCode, groupName, products }),
        });
    },

    getProductBySlug: async (slug: string) => {
        return fetchAPI(`/products/${slug}`);
    },

    getProductById: async (id: number) => {
        return fetchAPI(`/products/${id}`);
    }
};

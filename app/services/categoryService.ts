import { fetchAPI } from "../lib/api";

export interface Category {
    id: number;
    name: string;
    slug: string;
    imageUrl?: string;
    brand?: {
        id: number;
        name: string;
    };
    brandId?: number; // Optional reference for creation if used that way
}

export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export const categoryService = {
    getCategories: async (params?: { search?: string; brandId?: number; sortBy?: string; order?: string; page?: number; size?: number }): Promise<Page<Category>> => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append("search", params.search);
        if (params?.brandId) queryParams.append("brandId", params.brandId.toString());
        if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params?.order) queryParams.append("order", params.order);
        if (params?.page !== undefined) queryParams.append("page", params.page.toString());
        if (params?.size !== undefined) queryParams.append("size", params.size.toString());

        const queryString = queryParams.toString();
        return fetchAPI(`/categories${queryString ? `?${queryString}` : ""}`);
    },
    getCategoryById: async (id: number) => {
        return fetchAPI(`/categories/${id}`);
    },
    createCategory: async (data: Partial<Category>) => {
        return fetchAPI("/categories", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    updateCategory: async (id: number, data: Partial<Category>) => {
        return fetchAPI(`/categories/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },
    deleteCategory: async (id: number) => {
        return fetchAPI(`/categories/${id}`, {
            method: "DELETE",
        });
    },
};

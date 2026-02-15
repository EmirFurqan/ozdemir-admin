import { fetchAPI } from "../lib/api";

export interface Catalog {
    id: number;
    name: string;
    url: string;
    imgUrl: string;
    type: string;
    releaseDate: string;
    description: string;
}

export const catalogService = {
    getAllCatalogs: async () => {
        return fetchAPI("/admin/catalogs");
    },

    getCatalogsPublic: async () => {
        return fetchAPI("/public/catalogs");
    },

    deleteCatalog: async (id: number) => {
        return fetchAPI(`/admin/catalogs/${id}`, {
            method: "DELETE",
        });
    },

    createCatalog: async (data: Partial<Catalog>) => {
        return fetchAPI("/admin/catalogs", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    updateCatalog: async (id: number, data: Partial<Catalog>) => {
        return fetchAPI(`/admin/catalogs/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "catalog");

        // We need to bypass fetchAPI for file uploads because it sets Content-Type to JSON
        // and doesn't handle FormData well if we force it.
        // So we'll access API_BASE_URL logic here or reuse it.

        // Since API_BASE_URL is local, let's grab it from environment or hardcode similarly
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api";
        let token = null;

        if (typeof window !== 'undefined') {
            // Try to get token from cookie on client side if possible, or maybe it's HttpOnly?
            // If HttpOnly, browser sends it automatically?
            // But fetch needs credentials: 'include'.
            // Let's assume for now we might need to handle this manually or check how other services do it.
            // Actually, the previous implementation used localStorage 'token'. 
            // Let's check if localStorage is used in this project.
            token = localStorage.getItem('token'); // Try local storage as well
        }

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/upload`, {
            method: "POST",
            body: formData,
            headers
        });

        if (!res.ok) {
            throw new Error("File upload failed");
        }

        const data = await res.json();
        return data.url;
    }
};

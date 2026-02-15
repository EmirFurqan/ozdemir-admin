import { fetchAPI } from "../lib/api";

export interface Banner {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
    displayOrder: number;
    isActive: boolean;
    active?: boolean;
}

export const bannerService = {
    getAllBanners: async () => {
        return fetchAPI("/admin/banners");
    },

    createBanner: async (banner: Partial<Banner>) => {
        return fetchAPI("/admin/banners", {
            method: "POST",
            body: JSON.stringify(banner),
        });
    },

    updateBanner: async (id: number, banner: Partial<Banner>) => {
        return fetchAPI(`/admin/banners/${id}`, {
            method: "PUT",
            body: JSON.stringify(banner),
        });
    },

    deleteBanner: async (id: number) => {
        return fetchAPI(`/admin/banners/${id}`, {
            method: "DELETE",
        });
    },

    reorderBanners: async (bannerIds: number[]) => {
        return fetchAPI("/admin/banners/reorder", {
            method: "POST",
            body: JSON.stringify(bannerIds),
        });
    }
};

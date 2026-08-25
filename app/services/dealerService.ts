import { fetchAPI } from "@/app/lib/api";

export interface CariDto {
    id: number;
    logoLogicalRef: number;
    code: string;
    definition: string;
    groupCode: string;
    bayiActive: boolean;
    email?: string;
    phone?: string;
    city?: string;
    district?: string;
    userCount: number;
}

export interface UserDto {
    id?: number;
    username: string;
    email: string;
    fullName?: string;
    role?: string;
    companyName?: string;
    cariCode?: string;
}

export interface DealerUserRequest {
    fullName: string;
    email: string;
    username: string;
    password?: string;
    phone?: string;
    role?: string; // CUSTOMER_OWNER, CUSTOMER_STAFF
    status?: string; // ACTIVE, PASSIVE
}

export const dealerService = {
    async getDealers(params?: { bayiActive?: boolean; search?: string; page?: number; size?: number }) {
        const q = new URLSearchParams();
        if (params?.bayiActive !== undefined) q.set("bayiActive", String(params.bayiActive));
        if (params?.search) q.set("search", params.search);
        if (params?.page !== undefined) q.set("page", String(params.page));
        if (params?.size !== undefined) q.set("size", String(params.size));

        return fetchAPI(`/admin/dealers?${q.toString()}`, { cache: "no-store" });
    },

    async getDealerById(id: number): Promise<CariDto> {
        return fetchAPI(`/admin/dealers/${id}`, { cache: "no-store" });
    },

    async toggleStatus(id: number): Promise<CariDto> {
        return fetchAPI(`/admin/dealers/${id}/toggle-status`, {
            method: "PUT"
        });
    },

    async updateDealerDetails(id: number, data: Partial<CariDto>): Promise<CariDto> {
        return fetchAPI(`/admin/dealers/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        });
    },

    async getDealerUsers(id: number): Promise<UserDto[]> {
        return fetchAPI(`/admin/dealers/${id}/users`, { cache: "no-store" });
    },

    async createUserForDealer(id: number, data: DealerUserRequest): Promise<UserDto> {
        return fetchAPI(`/admin/dealers/${id}/users`, {
            method: "POST",
            body: JSON.stringify(data)
        });
    },

    async updateUser(userId: number, data: DealerUserRequest): Promise<UserDto> {
        return fetchAPI(`/admin/dealers/users/${userId}`, {
            method: "PUT",
            body: JSON.stringify(data)
        });
    },

    async deleteUser(userId: number): Promise<void> {
        return fetchAPI(`/admin/dealers/users/${userId}`, {
            method: "DELETE"
        });
    }
};

import { fetchAPI } from "@/app/lib/api";

export interface OrderItemDto {
    id: number;
    productId: number;
    logoItemLogicalRef?: number;
    productCode: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    vatAmount: number;
    totalPrice: number;
    currency: string;
    currencyId: number;
}

export interface OrderDto {
    id: number;
    orderNumber: string;
    cariId: number;
    cariLogoLogicalRef?: number;
    cariCode: string;
    cariName: string;
    userFullName?: string;
    userEmail?: string;
    orderDate: string;
    totalAmount: number;
    totalVat: number;
    grandTotal: number;
    currency: string;
    currencyId: number;
    notes?: string;
    status: string; // PENDING_SYNC, SYNCED_TO_LOGO, FAILED_SYNC, PROCESSING, CANCELLED, COMPLETED
    logoOrderLogicalRef?: number;
    logoOrderNumber?: string;
    syncStatus: string; // PENDING, SUCCESS, FAILED
    syncMessage?: string;
    syncedAt?: string;
    createdAt: string;
    items?: OrderItemDto[];
}

export const orderService = {
    async getOrders(params?: {
        status?: string;
        syncStatus?: string;
        cariId?: number;
        search?: string;
        page?: number;
        size?: number;
    }) {
        const q = new URLSearchParams();
        if (params?.status) q.set("status", params.status);
        if (params?.syncStatus) q.set("syncStatus", params.syncStatus);
        if (params?.cariId) q.set("cariId", String(params.cariId));
        if (params?.search) q.set("search", params.search);
        if (params?.page !== undefined) q.set("page", String(params.page));
        if (params?.size !== undefined) q.set("size", String(params.size));

        return fetchAPI(`/admin/orders?${q.toString()}`, { cache: "no-store" });
    },

    async getOrderById(id: number): Promise<OrderDto> {
        return fetchAPI(`/admin/orders/${id}`, { cache: "no-store" });
    },

    async updateOrderStatus(id: number, status: string): Promise<OrderDto> {
        return fetchAPI(`/admin/orders/${id}/status?status=${status}`, {
            method: "PUT"
        });
    },

    async cancelOrder(id: number, reason?: string): Promise<OrderDto> {
        const q = reason ? `?reason=${encodeURIComponent(reason)}` : "";
        return fetchAPI(`/admin/orders/${id}/cancel${q}`, {
            method: "PUT"
        });
    },

    async deleteOrder(id: number): Promise<any> {
        return fetchAPI(`/admin/orders/${id}`, {
            method: "DELETE"
        });
    }
};

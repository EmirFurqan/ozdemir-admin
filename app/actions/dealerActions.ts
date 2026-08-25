'use server'

import { dealerService, DealerUserRequest } from "../services/dealerService";
import { orderService } from "../services/orderService";
import { revalidatePath } from "next/cache";

export async function fetchDealersAction(page: number = 0, size: number = 15, search: string = "", activeOnly: boolean = false) {
    try {
        return await dealerService.getDealers({
            page,
            size,
            search,
            bayiActive: activeOnly ? true : undefined
        });
    } catch (error) {
        console.error("fetchDealersAction error:", error);
        return null;
    }
}

export async function toggleDealerStatusAction(id: number) {
    try {
        const res = await dealerService.toggleStatus(id);
        revalidatePath("/dealers");
        return res;
    } catch (error) {
        console.error("toggleDealerStatusAction error:", error);
        throw error;
    }
}

export async function fetchDealerUsersAction(dealerId: number) {
    try {
        return await dealerService.getDealerUsers(dealerId);
    } catch (error) {
        console.error("fetchDealerUsersAction error:", error);
        return [];
    }
}

export async function createDealerUserAction(dealerId: number, userData: DealerUserRequest) {
    try {
        const res = await dealerService.createUserForDealer(dealerId, userData);
        revalidatePath("/dealers");
        return res;
    } catch (error) {
        console.error("createDealerUserAction error:", error);
        throw error;
    }
}

export async function deleteDealerUserAction(dealerId: number, userId: number) {
    try {
        const res = await dealerService.deleteUser(userId);
        revalidatePath("/dealers");
        return res;
    } catch (error) {
        console.error("deleteDealerUserAction error:", error);
        throw error;
    }
}

export async function fetchDealerOrdersAction(page: number = 0, size: number = 15, search: string = "", syncStatus: string = "") {
    try {
        return await orderService.getOrders({
            page,
            size,
            search,
            syncStatus: syncStatus || undefined
        });
    } catch (error) {
        console.error("fetchDealerOrdersAction error:", error);
        return null;
    }
}

export async function fetchDealerOrderDetailAction(orderId: number) {
    try {
        return await orderService.getOrderById(orderId);
    } catch (error) {
        console.error("fetchDealerOrderDetailAction error:", error);
        return null;
    }
}

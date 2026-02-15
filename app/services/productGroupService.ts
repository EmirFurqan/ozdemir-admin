
import { fetchAPI } from "@/app/lib/api";

export interface ProductGroup {
    id: number;
    groupCode: string;
    name: string;
}

export const productGroupService = {
    getProductGroups: async () => {
        return fetchAPI("/product-groups");
    }
};

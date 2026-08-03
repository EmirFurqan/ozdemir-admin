import { fetchAPI } from "@/app/lib/api";
import ErpMatcherClient from "./ErpMatcherClient";

export const dynamic = 'force-dynamic';

export default async function ErpMatcherPage() {
    let products = [];
    try {
        const res = await fetchAPI("/products?page=0&size=5000&grouped=false");
        products = res.content || [];
    } catch (error) {
        console.error("Failed to fetch products for ERP Matcher", error);
    }

    return <ErpMatcherClient initialProducts={products} />;
}

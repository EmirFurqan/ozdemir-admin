import { brandService, Brands } from "@/app/services/brandService";
import BrandsManager from "./BrandsManager";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
    const brandsData = await brandService.getBrands().catch(() => [] as Brands[]);
    const rawBrands: Brands[] = Array.isArray(brandsData) ? brandsData : [];

    const sortedBrands = [...rawBrands].sort((a, b) => {
        const orderA = a.displayOrder && a.displayOrder > 0 ? a.displayOrder : 999999;
        const orderB = b.displayOrder && b.displayOrder > 0 ? b.displayOrder : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return a.id - b.id;
    });

    return <BrandsManager initialBrands={sortedBrands} />;
}

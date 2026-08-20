import { fetchAPI } from "../lib/api";

export interface OverviewStats {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    totalBrands: number;
    totalCategories: number;
    totalProductGroups: number;
    totalStockUnits: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    unbrandedProductCount: number;
    uncategorizedProductCount: number;
    noImageProductCount: number;
    zeroPriceProductCount: number;
}

export interface CurrencyFinancialStats {
    currencyId: number;
    currencyCode: string;
    currencySymbol: string;
    productCount: number;
    totalStockUnits: number;
    totalCatalogPriceExclVat: number;
    totalCatalogPriceInclVat: number;
    totalInventoryValueExclVat: number;
    totalInventoryValueInclVat: number;
    averagePrice: number;
}

export interface BrandStats {
    brandId: number | null;
    brandName: string;
    logoName: string | null;
    productCount: number;
    productPercentage: number;
    activeProductCount: number;
    totalStockUnits: number;
    outOfStockCount: number;
    financials: CurrencyFinancialStats[];
    totalInventoryValueExclVat: number;
    totalInventoryValueInclVat: number;
    totalCatalogPriceExclVat: number;
    totalCatalogPriceInclVat: number;
    primaryCurrencySymbol: string;
}

export interface CategoryStats {
    categoryId: number | null;
    categoryName: string;
    productCount: number;
    productPercentage: number;
    totalStockUnits: number;
    financials: CurrencyFinancialStats[];
}

export interface StockHealthStats {
    inStock: number;
    lowStock: number;
    outOfStock: number;
    inStockPercentage: number;
    lowStockPercentage: number;
    outOfStockPercentage: number;
}

export interface TopProductItem {
    id: number;
    name: string;
    code: string;
    slug: string;
    brandName: string;
    stock: number;
    price: number;
    vatRate: number;
    priceWithVat: number;
    currencySymbol: string;
    currencyId: number;
    totalInventoryValueExclVat: number;
    totalInventoryValueInclVat: number;
    imageUrl: string | null;
    viewCount: number;
}

export interface DashboardStats {
    overview: OverviewStats;
    currencyFinancials: CurrencyFinancialStats[];
    brandStats: BrandStats[];
    categoryStats: CategoryStats[];
    stockHealth: StockHealthStats;
    topValueProducts: TopProductItem[];
    topPriceProducts: TopProductItem[];
    topViewedProducts: TopProductItem[];
}

export const dashboardService = {
    getStats: async (): Promise<DashboardStats | null> => {
        return fetchAPI("/dashboard/stats");
    }
};

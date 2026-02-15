import { bannerService } from "@/app/services/bannerService";
import BannerFormPageWrapper from "./BannerFormPageWrapper";

export const dynamic = 'force-dynamic';

export default async function BannerEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const isNew = id === 'new';
    let banner = null;

    if (!isNew) {
        try {
            const result = await bannerService.getAllBanners(); // API might not have single get endpoint yet?
            // Assuming getAllBanners returns list, filtering manually for now if no getById
            // Wait, looking at service, there is NO getBannerById. 
            // I should double check that. But for now, filtering is safe fallback.
            // If the API supports /admin/banners/{id} with GET, I should use that.
            // But let's check `api.ts` fetchAPI calls.

            // Checking service again...
            // It has getAllBanners, createBanner, updateBanner, deleteBanner, reorderBanners.
            // It DOES NOT have getBannerById.
            // So I will fetch all and filter.
            if (Array.isArray(result)) {
                banner = result.find((b: any) => b.id.toString() === id);
            }
        } catch (e) {
            console.error("Failed to fetch banner", e);
        }
    }

    if (!isNew && !banner) {
        return (
            <div className="container mx-auto py-10 px-4 flex flex-col items-center justify-center min-h-[50vh]">
                <h1 className="text-2xl font-bold mb-4 text-slate-800">Banner Bulunamadı</h1>
                <p className="text-slate-500 mb-6">Aradığınız banner silinmiş veya mevcut değil.</p>
                <a href="/banners" className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors">
                    Listeye Dön
                </a>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold mb-2 text-slate-900">{isNew ? "Yeni Banner Ekle" : "Banner Düzenle"}</h1>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <BannerFormPageWrapper banner={banner} />
            </div>
        </div>
    );
}

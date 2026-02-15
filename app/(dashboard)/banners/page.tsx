import { bannerService } from "@/app/services/bannerService";
import BannerManager from "./banner-manager";

export const dynamic = 'force-dynamic';

export default async function BannersPage() {
    let banners = [];
    try {
        banners = await bannerService.getAllBanners();
    } catch (e) {
        console.error("Failed to fetch banners", e);
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Banner Yönetimi</h1>
                    <p className="text-slate-500">Anasayfa banner slider alanını yönetin.</p>
                </div>
            </div>

            <BannerManager initialBanners={banners || []} />
        </div>
    );
}

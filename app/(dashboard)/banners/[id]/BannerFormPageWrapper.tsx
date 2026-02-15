"use client";

import BannerForm from "../banner-form";
import { Banner } from "@/app/services/bannerService";
import { useRouter } from "next/navigation";

export default function BannerFormPageWrapper({ banner }: { banner?: Partial<Banner> | null }) {
    const router = useRouter();

    const handleSuccess = () => {
        router.push("/banners");
        router.refresh();
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <BannerForm
            banner={banner || undefined}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
        />
    );
}

import { brandService } from "@/app/services/brandService";
import BrandForm from "../BrandForm";

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let brand = null;
    if (id !== "new") {
        brand = await brandService.getBrandById(Number(id));
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{id === "new" ? "Yeni Marka Ekle" : "Markayı Düzenle"}</h1>
            </div>
            <BrandForm brand={brand} key={id} />
        </div>
    );
}

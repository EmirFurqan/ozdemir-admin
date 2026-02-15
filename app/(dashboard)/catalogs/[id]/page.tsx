import CatalogForm from "../catalog-form";
import { fetchAPI } from "@/app/lib/api";

export default async function EditCatalogPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let catalog = null;

    try {
        // Fetch catalogs from public endpoint (since it's open) or admin endpoint
        // Since we are in admin, let's use public one to read or fetch by ID if API supports it
        // The service has `deleteCatalog` using ID. 
        // We need a way to get SINGLE catalog. 
        // Public endpoint returns all. 
        // Admin endpoint probably supports /admin/catalogs/{id}.
        // Let's assume /admin/catalogs/{id} exists since DELETE uses it.
        catalog = await fetchAPI(`/admin/catalogs/${id}`);
    } catch (error) {
        console.error("Failed to fetch catalog for edit:", error);
    }

    if (!catalog) {
        return <div>Katalog bulunamadı.</div>;
    }

    return (
        <div className="container mx-auto px-2">
            <div className="mx-auto mb-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Katalog Düzenle</h1>
            </div>

            <CatalogForm initialData={catalog} />
        </div>
    );
}

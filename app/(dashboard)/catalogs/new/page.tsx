import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import CatalogForm from "../catalog-form";

export default function NewCatalogPage() {
    return (
        <div className="container mx-auto py-10 px-4">
            <div className="max-w-2xl mx-auto mb-6">
                <Link href="/catalogs" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Kataloglara Dön
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Yeni Katalog Ekle</h1>
                <p className="text-slate-500">Listeye yeni bir fiyat listesi veya ürün kataloğu ekleyin.</p>
            </div>

            <CatalogForm />
        </div>
    );
}

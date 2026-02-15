"use client";

import { useActionState, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { createProductGroupWithProducts } from "@/app/actions/productGroup";
import { getProductsForSelect } from "@/app/actions/product";
import { Trash2, Plus, Loader2 } from "lucide-react";

export default function CreateGroupForm({ allProducts: initialProducts = [] }: { allProducts?: any[] }) {
    const [state, formAction] = useActionState(createProductGroupWithProducts, null);

    // Async product fetching for performance
    const [availableProducts, setAvailableProducts] = useState<any[]>(initialProducts);
    const [isLoadingProducts, setIsLoadingProducts] = useState(initialProducts.length === 0);

    // Fetch products on mount if not provided
    useEffect(() => {
        if (availableProducts.length === 0) {
            getProductsForSelect().then(data => {
                setAvailableProducts(data);
                setIsLoadingProducts(false);
            });
        } else {
            setIsLoadingProducts(false);
        }
    }, []);

    // Local state for products to be added
    const [selectedProducts, setSelectedProducts] = useState<{ id: string, code: string, name: string, variantLabel: string }[]>([]);

    const [currentProductId, setCurrentProductId] = useState("");
    const [currentVariantLabel, setCurrentVariantLabel] = useState("");

    const productOptions = availableProducts.map(p => ({
        value: p.id.toString(),
        label: `${p.code} - ${p.name}`
    }));

    const addProductToList = () => {
        if (!currentProductId) return;

        // Prevent duplicates
        if (selectedProducts.find(p => p.id === currentProductId)) {
            alert("Bu ürün zaten listede.");
            return;
        }

        const product = availableProducts.find(p => p.id.toString() === currentProductId);
        if (product) {
            setSelectedProducts([...selectedProducts, {
                id: currentProductId,
                code: product.code,
                name: product.name,
                variantLabel: currentVariantLabel
            }]);
            setCurrentProductId("");
            setCurrentVariantLabel("");
        }
    };

    const removeProductFromList = (id: string) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== id));
    };

    return (
        <form action={formAction} className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <input type="hidden" name="products" value={JSON.stringify(selectedProducts)} />

            {/* Left Col: Group Info */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 h-fit">
                <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Grup Bilgileri</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Grup Kodu</label>
                        <Input
                            name="groupCode"
                            required
                            placeholder="Örn: 8100XX"
                            className="bg-slate-50"
                        />
                        <p className="text-[10px] text-slate-500">Benzersiz grup kodu.</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Grup Adı</label>
                        <Input
                            name="name"
                            required
                            placeholder="Örn: Üstten Depo Tabancalar"
                            className="bg-slate-50"
                        />
                    </div>
                </div>

                {state?.message && (
                    <div className="p-3 bg-red-100 text-red-600 rounded text-sm border border-red-200">
                        {state.message}
                    </div>
                )}

                <div className="pt-4">
                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white shadow-sm">
                        Kaydet ve Oluştur
                    </Button>
                </div>
            </div>

            {/* Right Col: Product Selection */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Grup Ürünleri Seçimi</h3>

                {/* Adder */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                    <h4 className="text-sm font-medium text-slate-900">Listeye Ürün Ekle</h4>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-6 space-y-2">
                            <label className="text-xs font-medium text-slate-500">Ürün Seç</label>
                            <Combobox
                                options={productOptions}
                                value={currentProductId}
                                onChange={setCurrentProductId}
                                placeholder="Ürün Ara..."
                                searchPlaceholder="Ara..."
                            />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                            <label className="text-xs font-medium text-slate-500">Varyasyon Etiketi</label>
                            <Input
                                value={currentVariantLabel}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentVariantLabel(e.target.value)}
                                placeholder="Örn: 1.5mm"
                                className="bg-white h-10"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Button type="button" onClick={addProductToList} disabled={!currentProductId} className="w-full">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="overflow-hidden rounded-md border border-slate-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-2">Kod</th>
                                <th className="px-4 py-2">Ürün Adı</th>
                                <th className="px-4 py-2">Etiket</th>
                                <th className="px-4 py-2 text-right">Sil</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {selectedProducts.length > 0 ? (
                                selectedProducts.map((p) => (
                                    <tr key={p.id} className="bg-white hover:bg-slate-50">
                                        <td className="px-4 py-2 font-mono text-slate-600">{p.code}</td>
                                        <td className="px-4 py-2 text-slate-900">{p.name}</td>
                                        <td className="px-4 py-2">
                                            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                                {p.variantLabel || "-"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeProductFromList(p.id)}
                                                className="h-8 w-8 bg-white border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                                        Listeye henüz ürün eklenmedi.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </form>
    );
}

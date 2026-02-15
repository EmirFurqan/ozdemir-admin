"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { addProductToGroup, removeProductFromGroup } from "@/app/actions/productGroup";
import { Trash2, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

// Helper wrapper for server action to be used in form
async function addProductAction(prevState: any, formData: FormData) {
    const groupId = parseInt(formData.get("groupId") as string);
    const productId = parseInt(formData.get("productId") as string);
    const variantLabel = formData.get("variantLabel") as string;

    if (!productId) return { message: "Ürün seçilmelidir." };

    return await addProductToGroup(groupId, productId, variantLabel);
}

export default function ProductGroupProductsManager({
    groupId,
    products,
    allProducts
}: {
    groupId: number,
    products: any[],
    allProducts: any[] // We need a list of ALL products to select from
}) {
    const [selectedProductId, setSelectedProductId] = useState("");
    const [variantLabel, setVariantLabel] = useState("");
    const [state, formAction] = useActionState(addProductAction, null);

    // Filter out products already in the group
    const availableProducts = allProducts
        ? allProducts.map(p => ({
            value: p.id.toString(),
            label: `${p.code} - ${p.name}`
        }))
        : [];

    // In a real app with many products, we'd want server-side search for the Combobox.
    // implementing client-side filtering on `allProducts` for now as list might be manageable or cached.

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-semibold text-slate-900">Grup Ürünleri</h3>
                <span className="text-sm text-slate-500">{products?.length || 0} Ürün</span>
            </div>

            {/* Add Product Form */}
            <form action={formAction} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <input type="hidden" name="groupId" value={groupId} />
                <input type="hidden" name="productId" value={selectedProductId} />

                <h4 className="text-sm font-medium text-slate-900">Mevcut Ürün Ekle</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-6 space-y-2">
                        <label className="text-xs font-medium text-slate-500">Ürün Seç</label>
                        <Combobox
                            options={availableProducts}
                            value={selectedProductId}
                            onChange={setSelectedProductId}
                            placeholder="Ürün Ara..."
                            searchPlaceholder="Kod veya İsim ile ara..."
                            emptyText="Ürün bulunamadı."
                        />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                        <label className="text-xs font-medium text-slate-500">Varyasyon Etiketi</label>
                        <Input
                            name="variantLabel"
                            value={variantLabel}
                            onChange={(e) => setVariantLabel(e.target.value)}
                            placeholder="Örn: 1.5mm"
                            className="bg-white"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Button type="submit" disabled={!selectedProductId} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="w-4 h-4 mr-1" /> Ekle
                        </Button>
                    </div>
                </div>
                {state?.message && (
                    <p className={`text-xs ${(state as any)?.success ? 'text-green-600' : 'text-red-500'}`}>{state.message}</p>
                )}
            </form>

            {/* Product List */}
            <div className="overflow-hidden rounded-md border border-slate-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Kod</th>
                            <th className="px-4 py-3">Ürün Adı</th>
                            <th className="px-4 py-3">Etiket</th>
                            <th className="px-4 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products && products.length > 0 ? (
                            products.map((p) => (
                                <tr key={p.id} className="bg-white hover:bg-slate-50/50">
                                    <td className="px-4 py-3 font-mono text-slate-600">{p.code}</td>
                                    <td className="px-4 py-3 text-slate-900">{p.name}</td>
                                    <td className="px-4 py-3">
                                        {p.variantLabel ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {p.variantLabel}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                                        <Link href={`/products/${p.id}`} target="_blank">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <form action={async () => {
                                            if (!confirm("Bu ürünü gruptan çıkarmak istediğinize emin misiniz?")) return;
                                            await removeProductFromGroup(p.id);
                                        }}>
                                            <Button type="submit" variant="outline" size="icon" className="h-8 w-8 bg-white border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </form>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                                    Bu grupta henüz ürün yok.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

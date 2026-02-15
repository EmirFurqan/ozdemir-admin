import { getProductGroups } from "@/app/actions/productGroup";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import Link from "next/link";

export default async function ProductGroupsPage() {
    const groups = await getProductGroups();

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Ürün Grupları (Varyasyonlar)</h1>
                <Link href="/product-groups/new">
                    <Button className="bg-red-600 hover:bg-red-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Yeni Grup Ekle
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Grup Kodu</th>
                            <th className="px-6 py-4">Grup Adı</th>
                            <th className="px-6 py-4 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {groups && groups.length > 0 ? (
                            groups.map((group: any) => (
                                <tr key={group.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500">#{group.id}</td>
                                    <td className="px-6 py-4 font-mono text-slate-700">{group.groupCode}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{group.name}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/product-groups/${group.id}`}>
                                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-white border-slate-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                                    Henüz hiç ürün grubu bulunmuyor.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

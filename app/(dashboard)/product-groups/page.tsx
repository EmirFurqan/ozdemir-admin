import { getProductGroups } from "@/app/actions/productGroup";
import { Button } from "@/components/ui/button";
import SearchBar from "@/app/components/SearchBar";
import GroupDeleteButton from "./GroupDeleteButton";
import { Plus, Edit, Layers, Filter, X } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function ProductGroupsPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string }>;
}) {
    const params = await searchParams;
    const search = params.search || "";

    const allGroups = await getProductGroups();

    // Filtering logic by Group Code, Group Name, or Group ID
    const filteredGroups = (allGroups || []).filter((g: any) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase().trim();
        return (
            (g.groupCode && g.groupCode.toLowerCase().includes(q)) ||
            (g.name && g.name.toLowerCase().includes(q)) ||
            (g.id && g.id.toString().includes(q))
        );
    });

    return (
        <div className="container mx-auto py-10 px-4 space-y-6">
            {/* Top Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-red-600" />
                        Ürün Grupları (Varyasyonlar)
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Ürün gruplarını arayın, filtreleyin ve düzenleyin.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                        {filteredGroups.length} / {allGroups?.length || 0} Grup
                    </span>
                    <Link href="/product-groups/new">
                        <Button className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer">
                            <Plus className="w-4 h-4 mr-1.5" /> Yeni Grup Ekle
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filter & Search Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                <div className="flex-1 max-w-lg">
                    <SearchBar
                        defaultValue={search}
                        placeholder="Grup kodu, grup adı veya ID ile arayın..."
                    />
                </div>

                {search && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">
                            Arama: <span className="font-bold text-slate-900">&quot;{search}&quot;</span>
                        </span>
                        <Link
                            href="/product-groups"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-100 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" /> Filtreyi Temizle
                        </Link>
                    </div>
                )}
            </div>

            {/* Groups Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 w-20">ID</th>
                            <th className="px-6 py-4">Grup Kodu</th>
                            <th className="px-6 py-4">Grup Adı</th>
                            <th className="px-6 py-4 text-right w-24">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map((group: any) => (
                                <tr key={group.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">#{group.id}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">
                                            {group.groupCode}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-900">
                                        {group.name}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/product-groups/${group.id}`}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 bg-white border-slate-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 cursor-pointer"
                                                    title="Grup Düzenle"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <GroupDeleteButton groupId={group.id} groupName={group.name} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                                    {search ? (
                                        <div className="space-y-2">
                                            <p className="text-slate-700 font-medium">Aramanıza uygun ürün grubu bulunamadı.</p>
                                            <Link href="/product-groups" className="text-xs text-red-600 font-bold hover:underline">
                                                Tüm grupları göster
                                            </Link>
                                        </div>
                                    ) : (
                                        "Henüz hiç ürün grubu bulunmuyor."
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

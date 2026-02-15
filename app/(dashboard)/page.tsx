import Link from "next/link";
import { Package, Users, Settings, LogOut } from "lucide-react";

export default function AdminDashboard() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <Link href="/products" className="block p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Package className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Ürün Yönetimi</h3>
                            <p className="text-slate-500 text-sm">Ürün ekle, düzenle, sil</p>
                        </div>
                    </div>
                </Link>

                {/* Card 2 */}
                <Link href="/brands" className="block p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <Package className="w-8 h-8" /> {/* Using Package as placeholder for Brand icon if needed */}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Marka Yönetimi</h3>
                            <p className="text-slate-500 text-sm">Marka ve kategorileri yönet</p>
                        </div>
                    </div>
                </Link>

                {/* Card 3 */}
                <Link href="/settings" className="block p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
                            <Settings className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Ayarlar</h3>
                            <p className="text-slate-500 text-sm">Site ve sistem ayarları</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
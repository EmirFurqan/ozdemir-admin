"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAPI } from "../lib/api";

export default function UnauthorizedPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAPI("/auth/me")
            .then((data) => {
                setUser(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
            <h1 className="text-4xl font-bold text-red-500 mb-4">Erişim Reddedildi (403)</h1>
            <p className="text-lg text-slate-300 mb-8">Bu alana erişim yetkiniz bulunmamaktadır.</p>

            {loading ? (
                <p>Kullanıcı bilgisi yükleniyor...</p>
            ) : user ? (
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8 max-w-md w-full">
                    <p className="mb-2"><span className="text-slate-400">Kullanıcı:</span> {user.username}</p>
                    <p className="mb-2"><span className="text-slate-400">Rol:</span> <span className="font-bold text-yellow-400">{user.role}</span></p>
                    <p className="text-sm text-slate-500 mt-4">
                        Admin paneli için <strong>ADMIN</strong> rolü gereklidir.
                    </p>
                </div>
            ) : (
                <p className="mb-8">Kullanıcı bilgisi alınamadı.</p>
            )}

            <div className="flex gap-4">
                <Link
                    href="/api/auth/logout"
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
                >
                    Çıkış Yap
                </Link>
            </div>
        </div>
    );
}

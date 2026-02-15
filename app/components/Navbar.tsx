"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";

export function Navbar({ brands }: { brands: any[] }) {
    return (
        <nav className="top-0 z-50 bg-slate-950/95 backdrop-blur-md text-white border-b border-slate-900 shadow-lg font-sans transition-all">
            <div className="container mx-auto px-6 h-18 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="bg-red-600 text-white w-9 h-9 flex items-center justify-center rounded-xl font-bold text-xl shadow-red-900/20 shadow-lg transition-transform group-hover:scale-105">A</div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent leading-none">
                            Özdemir
                        </span>
                        <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">Admin Panel</span>
                    </div>
                </Link>

                <div className="hidden md:flex items-center gap-2 ml-8">
                    <Link href="/products" className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                        Ürünler
                    </Link>
                    <Link href="/brands" className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                        Markalar
                    </Link>
                    <Link href="/categories" className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                        Kategoriler
                    </Link>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-red-500 transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </div>
                        <span className="hidden sm:inline">Çıkış Yap</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}

"use client";

import { Menu, Search, Bell, Mail } from "lucide-react";

export function TopBar() {
    return (
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm">
            {/* Left: Mobile Menu Trigger & Search */}
            <div className="flex items-center gap-4">
                <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                    <Menu className="w-6 h-6" />
                </button>

                <div className="hidden md:flex items-center relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3" />
                    <input
                        type="text"
                        placeholder="Ara..."
                        className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 w-64 transition-all"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                    <Mail className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}

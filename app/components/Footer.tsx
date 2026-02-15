import React from "react";
import {
    Phone,
    Mail,
    MapPin,
    Facebook,
    Instagram,
    Linkedin,
} from "lucide-react";

export function Footer() {
    return (
        <footer className="mt-auto bg-slate-800 text-slate-200 py-4 text-sm border-t border-slate-900">


            <div className="flex container mx-auto flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-300">
                <div>&copy; 2026 Özdemir Makina.</div>
            </div>
        </footer>
    );
}

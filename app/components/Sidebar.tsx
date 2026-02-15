"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Box,
    Tags,
    Layers,
    Users,
    ShoppingCart,
    Briefcase,
    Store,
    User,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    LogIn,
    LogOut,
    MoreVertical,
    FileText,
    Image as ImageIcon
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";

interface SidebarProps {
    user?: {
        username: string;
        email: string;
        role?: string;
    } | null;
}

type NavItem = {
    title: string;
    icon: any;
    href: string;
    disabled?: boolean;
    items?: { title: string; href: string }[];
};

type NavGroup = {
    title: string;
    items: NavItem[];
};

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // State to track expanded menu items (by title)
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // State to track collapsed groups (by title)
    const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

    const toggleSubmenu = (title: string) => {
        setExpandedItems(prev =>
            prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title]
        );
    };

    const toggleGroup = (title: string) => {
        setCollapsedGroups(prev =>
            prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title]
        );
    };

    const navGroups: NavGroup[] = [
        {
            title: "Genel",
            items: [
                { title: "Dashboard", icon: LayoutDashboard, href: "/" }
            ]
        },
        {
            title: "Kurumsal",
            items: [
                {
                    title: "Ürün Yönetimi",
                    icon: Box,
                    href: "/products",
                    items: [
                        { title: "Tüm Ürünler", href: "/products" },
                        { title: "Grup Yönetimi", href: "/product-groups" },
                        { title: "Yeni Ürün Ekle", href: "/products/new" }
                    ]
                },
                { title: "Kataloglar", icon: FileText, href: "/catalogs" },
                { title: "Markalar", icon: Tags, href: "/brands" },
                { title: "Kategoriler", icon: Layers, href: "/categories" },
                { title: "Banner Yönetimi", icon: ImageIcon, href: "/banners" },
            ]
        },
        {
            title: "Bayi Sistemi",
            items: [
                { title: "Siparişler", icon: ShoppingCart, href: "/dealer/orders", disabled: true },
                { title: "Bayiler", icon: Briefcase, href: "/dealer/users", disabled: true },
            ]
        },
        {
            title: "E-Ticaret",
            items: [
                { title: "Siparişler", icon: ShoppingCart, href: "/ecommerce/orders", disabled: true },
                { title: "Müşteriler", icon: Users, href: "/ecommerce/customers", disabled: true },
                { title: "Mağaza Ayarları", icon: Store, href: "/ecommerce/settings", disabled: true },
            ]
        }
    ];

    return (
        <aside
            className={cn(
                "bg-slate-900 text-white h-screen sticky top-0 flex flex-col border-r border-slate-800 shadow-xl z-50 transition-[width] duration-300 ease-in-out relative group/aside will-change-[width]",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo Area */}
            <div className="h-16 flex items-center px-3 border-b border-slate-800 bg-slate-950 relative shrink-0 whitespace-nowrap z-[60]">
                {/* Logo wrapper for stable positioning */}
                <div className={cn(
                    "flex items-center w-full transition-all duration-300",
                    collapsed ? "justify-center px-0 gap-0" : "gap-3"
                )}>
                    <div className="relative w-8 h-8 shrink-0">
                        <Image src="/LogoOBeyaz.svg" alt="Özdemir" fill className="object-contain" />
                    </div>

                    {/* Brand Name - Fades in/out and slides slightly */}
                    <div className={cn(
                        "flex flex-col min-w-0 transition-all duration-300 ease-out origin-left overflow-hidden",
                        collapsed ? "w-0 opacity-0 pointer-events-none scale-95" : "w-auto opacity-100 scale-100"
                    )}>
                        <div className="relative h-5 w-24">
                            <Image src="/OzdemirLogoBeyaz.svg" alt="Özdemir Makina" fill className="object-contain object-left" />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5 whitespace-nowrap block">Admin Panel</span>
                    </div>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "absolute p-1.5 rounded-lg border border-slate-700 shadow-md transition-all duration-300 hover:text-white hover:bg-slate-800 z-[70] flex items-center justify-center bg-slate-900 text-slate-400",
                        collapsed
                            ? "right-[-12px] top-8 -translate-y-1/2 opacity-0 group-hover/aside:opacity-100"
                            : "right-3 top-8 -translate-y-1/2 bg-transparent border-transparent shadow-none text-slate-500 hover:bg-slate-800"
                    )}
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Navigation */}
            <div className={cn(
                "flex-1 py-6 space-y-6 scrollbar-hide w-full",
                collapsed ? "overflow-visible px-2" : "overflow-y-auto px-3"
            )}>
                {navGroups.map((group, index) => {
                    const isGroupCollapsed = collapsedGroups.includes(group.title);

                    return (
                        <div key={index} className="relative">
                            {/* Group Title - Fades out when collapsed */}
                            <div className={cn(
                                "flex items-center justify-between mb-2 px-2 transition-all duration-300",
                                collapsed ? "justify-center" : "justify-between"
                            )}>
                                <span className={cn(
                                    "text-xs font-bold text-slate-500 uppercase tracking-wider truncate transition-all duration-300",
                                    collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                                )}>
                                    {group.title}
                                </span>
                                {/* Only show collapse chevron if expanded */}
                                <button
                                    onClick={() => !collapsed && toggleGroup(group.title)}
                                    className={cn(
                                        "transition-all duration-300 hover:text-slate-300",
                                        collapsed ? "w-0 h-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                                    )}
                                >
                                    <ChevronDown className={cn("w-3 h-3 text-slate-500 transition-transform duration-200", isGroupCollapsed ? "-rotate-90" : "")} />
                                </button>
                                {/* Separator line for collapsed state to separate groups cleanly */}
                                {collapsed && index !== 0 && (
                                    <div className="h-px w-8 bg-slate-800 absolute top-[-12px] left-1/2 -translate-x-1/2"></div>
                                )}
                            </div>

                            <div className={cn(
                                "grid transition-[grid-template-rows] duration-300 ease-in-out",
                                isGroupCollapsed && !collapsed
                                    ? "grid-rows-[0fr] opacity-0"
                                    : "grid-rows-[1fr] opacity-100"
                            )}>
                                <div className={cn("overflow-hidden", collapsed && "overflow-visible")}>
                                    <div className="space-y-1">
                                        {group.items.map((item, itemIndex) => {
                                            const isActive = pathname === item.href || (item.items && item.items.some(sub => pathname === sub.href));
                                            const isExpanded = expandedItems.includes(item.title);
                                            const hasSubmenu = item.items && item.items.length > 0;

                                            return (
                                                <div key={itemIndex}>
                                                    {hasSubmenu && !collapsed ? (
                                                        <>
                                                            <button
                                                                onClick={() => toggleSubmenu(item.title)}
                                                                className={cn(
                                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative whitespace-nowrap",
                                                                    isActive && !isExpanded
                                                                        ? "bg-slate-800 text-white"
                                                                        : "text-slate-400 hover:text-white hover:bg-slate-800",
                                                                    item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-slate-400"
                                                                )}
                                                                disabled={item.disabled}
                                                            >
                                                                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                                                                <span className="flex-1 text-left truncate transition-all duration-300 opacity-100">{item.title}</span>
                                                                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 ml-auto", isExpanded ? "rotate-180" : "")} />
                                                            </button>

                                                            {/* Submenu Expanded */}
                                                            <div className={cn(
                                                                "grid transition-[grid-template-rows] duration-300 ease-in-out",
                                                                isExpanded ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
                                                            )}>
                                                                <div className="overflow-hidden">
                                                                    <div className="pl-10 space-y-1">
                                                                        {item.items!.map((subItem, subIndex) => {
                                                                            const isSubActive = pathname === subItem.href;
                                                                            return (
                                                                                <Link prefetch={false}
                                                                                    key={subIndex}
                                                                                    href={subItem.href}
                                                                                    className={cn(
                                                                                        "block px-3 py-2 rounded-md text-xs font-medium transition-colors hover:text-white truncate",
                                                                                        isSubActive ? "text-red-500 bg-slate-800/50" : "text-slate-500"
                                                                                    )}
                                                                                >
                                                                                    {subItem.title}
                                                                                </Link>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <Link prefetch={false}
                                                            href={item.disabled ? "#" : item.href}
                                                            className={cn(
                                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative whitespace-nowrap h-10",
                                                                isActive && !hasSubmenu
                                                                    ? "bg-red-600 text-white shadow-md shadow-red-900/20"
                                                                    : "text-slate-400 hover:text-white hover:bg-slate-800",
                                                                item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-slate-400",
                                                                collapsed ? "justify-center px-0 w-10 mx-auto gap-0" : "gap-3"
                                                            )}
                                                        >
                                                            <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />

                                                            {/* Text Label - Fades out cleanly */}
                                                            <span className={cn(
                                                                "transition-all duration-300 ease-in-out origin-left truncate",
                                                                collapsed ? "w-0 opacity-0 overflow-hidden ml-0" : "w-auto opacity-100 flex-1"
                                                            )}>
                                                                {item.title}
                                                            </span>

                                                            {/* Tooltip for collapsed state */}
                                                            {collapsed && (
                                                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[100] whitespace-nowrap border border-slate-700 shadow-xl translate-x-1 group-hover:translate-x-0 flex flex-col items-start gap-1 w-max">
                                                                    <span className="font-semibold">{item.title}</span>
                                                                    {hasSubmenu && item.items?.map((sub, si) => (
                                                                        <span key={si} className="text-slate-400 text-[10px] pl-1 border-l border-slate-600 before:content-['-'] before:mr-1">{sub.title}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </Link>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer / User Profile */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 relative shrink-0">
                {isMenuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <div className={cn(
                            "absolute z-[60] bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in duration-200",
                            collapsed
                                ? "left-full bottom-0 ml-2 w-56 mb-2 slide-in-from-left-2"
                                : "bottom-full left-3 right-3 mb-2 slide-in-from-bottom-2"
                        )}>
                            <div className="p-3 border-b border-slate-800">
                                <p className="text-sm font-medium text-white truncate">{user?.username || 'Kullanıcı'}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                            </div>
                            <button
                                onClick={async () => await logout()}
                                className="w-full flex items-center gap-2 p-3 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors text-left"
                            >
                                <LogOut className="w-4 h-4" />
                                Çıkış Yap
                            </button>
                        </div>
                    </>
                )}

                {user ? (
                    <div
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={cn(
                            "flex items-center p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group select-none relative z-50 h-[52px]",
                            collapsed ? "justify-center px-0 gap-0" : "gap-3"
                        )}
                    >
                        <div className="w-9 h-9 shrink-0 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 font-bold text-slate-300 group-hover:border-slate-600 transition-colors">
                            {user.username.charAt(0).toUpperCase()}
                        </div>

                        {/* User Info - Fades out cleanly */}
                        <div className={cn(
                            "flex-1 min-w-0 text-left transition-all duration-300 ease-in-out origin-left overflow-hidden whitespace-nowrap",
                            collapsed ? "w-0 opacity-0 scale-95" : "w-auto opacity-100 scale-100"
                        )}>
                            <div className="text-sm font-medium text-white truncate">{user.username}</div>
                            <div className="text-xs text-slate-500 truncate">{user.email}</div>
                        </div>

                        <MoreVertical className={cn(
                            "w-4 h-4 text-slate-500 group-hover:text-white transition-all duration-300 shrink-0",
                            collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                        )} />
                    </div>
                ) : (
                    <Link prefetch={false} href="/login" className={cn("flex items-center p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group text-slate-400 hover:text-white", collapsed ? "justify-center gap-0" : "gap-3")}>
                        <LogIn className="w-5 h-5" />
                        {!collapsed && <span className="text-sm font-medium">Giriş Yap</span>}
                    </Link>
                )}
            </div>
        </aside>
    );
}

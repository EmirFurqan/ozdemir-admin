"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: { label: string; href?: string }[];
    action?: {
        label: string;
        href: string;
        icon?: React.ElementType;
    };
}

export function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                        <Link href="/" className="hover:text-slate-900 transition-colors">Dashboard</Link>
                        {breadcrumbs.map((crumb, index) => (
                            <div key={index} className="flex items-center gap-1">
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                                {crumb.href ? (
                                    <Link href={crumb.href} className="hover:text-slate-900 transition-colors">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-slate-900 font-medium">{crumb.label}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                {description && <p className="text-sm text-slate-500">{description}</p>}
            </div>

            {action && (
                <Link href={action.href}>
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20">
                        {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                        {action.label}
                    </Button>
                </Link>
            )}
        </div>
    );
}

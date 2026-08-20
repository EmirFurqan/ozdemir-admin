"use client";

import React, { useState } from "react";

export interface BarItem {
    label: string;
    value: number;
    secondaryValue?: number;
    subLabel?: string;
    formattedValue?: string;
    formattedSecondaryValue?: string;
    icon?: string | null;
    linkUrl?: string;
}

interface BarChartProps {
    data: BarItem[];
    valueLabel?: string;
    secondaryValueLabel?: string;
    color?: string;
    secondaryColor?: string;
    showRanking?: boolean;
    maxItems?: number;
}

export function BarChart({
    data,
    valueLabel = "KDV Hariç Değer",
    secondaryValueLabel = "KDV Dahil Değer",
    color = "from-blue-600 to-indigo-600",
    secondaryColor = "from-emerald-500 to-teal-600",
    showRanking = true,
    maxItems = 10,
}: BarChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const items = data.slice(0, maxItems);
    const maxValue = Math.max(...items.map((i) => i.value || 0), 1);

    if (items.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 text-slate-400 text-sm">
                Veri bulunamadı.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {items.map((item, index) => {
                const percentage = Math.min(100, Math.max(4, (item.value / maxValue) * 100));
                const isHovered = hoveredIndex === index;

                return (
                    <div
                        key={index}
                        className={`p-3 rounded-xl border transition-all duration-200 ${
                            isHovered
                                ? "bg-slate-50 border-slate-300 shadow-sm"
                                : "bg-white border-slate-100 hover:border-slate-200"
                        }`}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        {/* Header: Rank + Label + Formatted Values */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0 pr-4">
                                {showRanking && (
                                    <span
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                            index === 0
                                                ? "bg-amber-100 text-amber-800"
                                                : index === 1
                                                ? "bg-slate-200 text-slate-700"
                                                : index === 2
                                                ? "bg-amber-700/10 text-amber-900"
                                                : "bg-slate-100 text-slate-500"
                                        }`}
                                    >
                                        {index + 1}
                                    </span>
                                )}
                                <span className="font-semibold text-slate-800 text-sm truncate" title={item.label}>
                                    {item.label}
                                </span>
                                {item.subLabel && (
                                    <span className="text-xs text-slate-400 shrink-0 font-medium">
                                        ({item.subLabel})
                                    </span>
                                )}
                            </div>

                            <div className="text-right shrink-0 flex items-center gap-3">
                                <div>
                                    <div className="text-xs font-bold text-slate-900">
                                        {item.formattedValue ?? item.value.toLocaleString("tr-TR")}
                                    </div>
                                    {item.formattedSecondaryValue && (
                                        <div className="text-[10px] text-slate-500 font-medium">
                                            KDV Dahil: {item.formattedSecondaryValue}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex items-center">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

"use client";

import React, { useState } from "react";

export interface DonutSegment {
    label: string;
    value: number;
    subValue?: string;
    color?: string;
    secondaryText?: string;
}

interface DonutChartProps {
    data: DonutSegment[];
    totalLabel?: string;
    centerSubtext?: string;
    size?: number;
    thickness?: number;
    formatValue?: (val: number) => string;
}

const DEFAULT_COLORS = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#8b5cf6", // Violet
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#6366f1", // Indigo
    "#14b8a6", // Teal
    "#ef4444", // Red
    "#84cc16", // Lime
    "#64748b", // Slate
];

export function DonutChart({
    data,
    totalLabel = "Toplam",
    centerSubtext = "Ürün",
    size = 260,
    thickness = 38,
    formatValue = (v) => v.toLocaleString("tr-TR"),
}: DonutChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

    if (total === 0 || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                <div className="w-32 h-32 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center text-xs">
                    Veri Yok
                </div>
            </div>
        );
    }

    const radius = size / 2;
    const innerRadius = radius - thickness;
    const center = radius;

    // Build arcs
    let currentAngle = -90; // Start at 12 o'clock

    const slices = data.map((item, index) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        const angle = (item.value / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle += angle;

        const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

        // Polar to Cartesian
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1Outer = center + radius * Math.cos(startRad);
        const y1Outer = center + radius * Math.sin(startRad);
        const x2Outer = center + radius * Math.cos(endRad);
        const y2Outer = center + radius * Math.sin(endRad);

        const x1Inner = center + innerRadius * Math.cos(endRad);
        const y1Inner = center + innerRadius * Math.sin(endRad);
        const x2Inner = center + innerRadius * Math.cos(startRad);
        const y2Inner = center + innerRadius * Math.sin(startRad);

        const largeArcFlag = angle > 180 ? 1 : 0;

        // Path definition
        const pathData = [
            `M ${x1Outer} ${y1Outer}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`,
            `L ${x1Inner} ${y1Inner}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner}`,
            "Z",
        ].join(" ");

        return {
            ...item,
            percentage,
            color,
            pathData,
            index,
        };
    });

    const activeItem = hoveredIndex !== null ? slices[hoveredIndex] : null;

    return (
        <div className="flex flex-col items-center">
            {/* Chart SVG */}
            <div className="relative flex items-center justify-center">
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="overflow-visible transform transition-transform duration-300"
                >
                    <g>
                        {slices.map((slice, i) => {
                            const isHovered = hoveredIndex === i;
                            return (
                                <path
                                    key={i}
                                    d={slice.pathData}
                                    fill={slice.color}
                                    className="transition-all duration-200 cursor-pointer"
                                    style={{
                                        opacity: hoveredIndex === null || isHovered ? 1 : 0.45,
                                        transform: isHovered ? "scale(1.04)" : "scale(1)",
                                        transformOrigin: `${center}px ${center}px`,
                                        filter: isHovered ? "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" : "none",
                                    }}
                                    onMouseEnter={() => setHoveredIndex(i)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                />
                            );
                        })}
                    </g>
                </svg>

                {/* Center Content */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4"
                    style={{ width: size, height: size }}
                >
                    {activeItem ? (
                        <div className="animate-fadeIn">
                            <p className="text-xs font-medium text-slate-500 truncate max-w-[130px]" title={activeItem.label}>
                                {activeItem.label}
                            </p>
                            <p className="text-xl font-bold text-slate-900 leading-tight">
                                {formatValue(activeItem.value)}
                            </p>
                            <p className="text-xs font-semibold" style={{ color: activeItem.color }}>
                                %{activeItem.percentage.toFixed(1)}
                            </p>
                            {activeItem.subValue && (
                                <p className="text-[10px] text-slate-400 mt-0.5">{activeItem.subValue}</p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                {totalLabel}
                            </p>
                            <p className="text-2xl font-bold text-slate-900 leading-tight">
                                {formatValue(total)}
                            </p>
                            <p className="text-xs text-slate-500">{centerSubtext}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend / Breakdown List */}
            <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {slices.map((slice, i) => {
                    const isHovered = hoveredIndex === i;
                    return (
                        <div
                            key={i}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all duration-150 ${
                                isHovered ? "bg-slate-100 ring-1 ring-slate-300" : "hover:bg-slate-50"
                            }`}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: slice.color }}
                                />
                                <span className="font-medium text-slate-700 truncate" title={slice.label}>
                                    {slice.label}
                                </span>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="font-semibold text-slate-900">
                                    {formatValue(slice.value)}
                                </span>
                                <span className="text-slate-400 ml-1 text-[11px]">
                                    (%{slice.percentage.toFixed(1)})
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

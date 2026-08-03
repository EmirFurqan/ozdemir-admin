"use client";

import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { updateProductErpInfo } from '@/app/actions/product';
import { Search, Upload, Link as LinkIcon, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Product {
    id: number;
    name: string;
    code: string;
    logoLogicalRef?: number | null;
    imageUrl?: string;
}

interface ErpRow {
    _id: string; // unique internal id
    [key: string]: any;
}

export default function ErpMatcherClient({ initialProducts }: { initialProducts: Product[] }) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [erpData, setErpData] = useState<ErpRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filtering & State
    const [dbSearch, setDbSearch] = useState("");
    const [hideMatched, setHideMatched] = useState(false);
    const [erpSearch, setErpSearch] = useState("");

    // Selection
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [selectedErpRowId, setSelectedErpRowId] = useState<string | null>(null);

    // Column Mapping
    const [codeColumn, setCodeColumn] = useState<string>("");
    const [logoRefColumn, setLogoRefColumn] = useState<string>("");

    // Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Handle File Upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                
                // Read as array of arrays to get headers
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
                if (data.length === 0) return;

                const fileHeaders = data[0].map(h => String(h).trim());
                setHeaders(fileHeaders);

                // Try to auto-detect columns
                const codeMatch = fileHeaders.find(h => h.toLowerCase().includes('kod') || h.toLowerCase() === 'code');
                const refMatch = fileHeaders.find(h => h.toLowerCase().includes('ref') || h.toLowerCase().includes('logo'));
                
                if (codeMatch) setCodeColumn(codeMatch);
                if (refMatch) setLogoRefColumn(refMatch);

                // Read as objects
                const rowData = XLSX.utils.sheet_to_json(ws) as any[];
                
                // Add internal ID
                const withIds = rowData.map((row, idx) => ({ ...row, _id: `row_${idx}` }));
                setErpData(withIds);
                
            } catch (err) {
                console.error(err);
                setMessage({ type: 'error', text: 'Dosya okunurken bir hata oluştu. Lütfen geçerli bir Excel veya CSV yükleyin.' });
            }
        };
        reader.readAsBinaryString(file);
    };

    // Filter Products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (hideMatched && p.logoLogicalRef) return false;
            
            const term = dbSearch.toLowerCase();
            return p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term);
        });
    }, [products, dbSearch, hideMatched]);

    // Filter ERP Data
    const filteredErpData = useMemo(() => {
        if (!erpSearch) return erpData;
        const term = erpSearch.toLowerCase();
        
        return erpData.filter(row => {
            // search in mapped columns only to be fast, or in all string values
            return Object.values(row).some(val => String(val).toLowerCase().includes(term));
        });
    }, [erpData, erpSearch]);

    // Handle Match Action
    const handleMatch = async () => {
        if (!selectedProductId || !selectedErpRowId) {
            setMessage({ type: 'error', text: 'Lütfen hem soldan bir ürün hem de sağdan bir ERP kaydı seçin.' });
            return;
        }

        if (!codeColumn || !logoRefColumn) {
            setMessage({ type: 'error', text: 'Lütfen yukarıdan Kod ve Logo Ref sütun eşleştirmelerini yapın.' });
            return;
        }

        const selectedErpRow = erpData.find(r => r._id === selectedErpRowId);
        if (!selectedErpRow) return;

        const newCode = String(selectedErpRow[codeColumn] || "");
        const newLogoRef = parseInt(selectedErpRow[logoRefColumn], 10);

        if (isNaN(newLogoRef)) {
            setMessage({ type: 'error', text: 'Seçili satırdaki Logo Ref geçerli bir sayı değil.' });
            return;
        }

        setIsProcessing(true);
        setMessage(null);

        try {
            const res = await updateProductErpInfo(selectedProductId, newCode, newLogoRef);
            
            if (res.success) {
                setMessage({ type: 'success', text: 'Ürün başarıyla eşleştirildi!' });
                
                // Update local state
                setProducts(prev => prev.map(p => 
                    p.id === selectedProductId 
                        ? { ...p, code: newCode, logoLogicalRef: newLogoRef } 
                        : p
                ));

                // Clear selection
                setSelectedProductId(null);
                setSelectedErpRowId(null);
            } else {
                setMessage({ type: 'error', text: res.message || 'Eşleştirme başarısız oldu.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Sunucu ile iletişimde hata oluştu.' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">ERP Eşleştirme</h1>
                    <p className="text-slate-500 text-sm">Ürünlerinizi Logo/ERP sistemi ile eşleştirin.</p>
                </div>

                <div className="flex gap-4 items-end">
                    {headers.length > 0 && (
                        <div className="flex gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">Ürün Kodu Sütunu</label>
                                <select 
                                    className="text-sm border-none bg-transparent py-1 pr-8 outline-none text-slate-700 font-medium cursor-pointer"
                                    value={codeColumn} 
                                    onChange={e => setCodeColumn(e.target.value)}
                                >
                                    <option value="">Seçiniz...</option>
                                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                            <div className="w-px bg-slate-200 mx-1"></div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">Logo Ref Sütunu</label>
                                <select 
                                    className="text-sm border-none bg-transparent py-1 pr-8 outline-none text-slate-700 font-medium cursor-pointer"
                                    value={logoRefColumn} 
                                    onChange={e => setLogoRefColumn(e.target.value)}
                                >
                                    <option value="">Seçiniz...</option>
                                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                    
                    <input 
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                    />
                    <Button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                        <Upload className="w-4 h-4 mr-2" />
                        {erpData.length > 0 ? "Farklı Dosya Yükle" : "Excel / CSV Yükle"}
                    </Button>
                </div>
            </div>

            {message && (
                <div className={cn(
                    "mb-4 p-3 rounded-lg flex items-center gap-2 text-sm shrink-0",
                    message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                )}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                
                {/* LEFT COLUMN: Database Products */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-w-0">
                    <div className="p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0 bg-slate-50/50 rounded-t-xl">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold text-slate-800">Sistem Ürünleri <span className="text-xs font-normal text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full ml-2">{filteredProducts.length}</span></h2>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input 
                                    placeholder="Ürün adı veya kodu ara..." 
                                    className="pl-9 bg-white"
                                    value={dbSearch}
                                    onChange={e => setDbSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                className="rounded text-red-600 focus:ring-red-500 bg-white border-slate-300 w-4 h-4"
                                checked={hideMatched}
                                onChange={e => setHideMatched(e.target.checked)}
                            />
                            Sadece Logo Ref'i BOŞ olanları göster
                        </label>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                        <div className="flex flex-col gap-1">
                            {filteredProducts.map(p => (
                                <div 
                                    key={p.id}
                                    onClick={() => setSelectedProductId(p.id)}
                                    className={cn(
                                        "p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3",
                                        selectedProductId === p.id 
                                            ? "border-red-500 bg-red-50 ring-1 ring-red-500 shadow-sm" 
                                            : "border-slate-100 hover:border-slate-300 hover:bg-slate-50",
                                        p.logoLogicalRef ? "opacity-70" : ""
                                    )}
                                >
                                    <div className="w-10 h-10 shrink-0 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center overflow-hidden">
                                        {p.imageUrl ? (
                                            <Image src={p.imageUrl} alt={p.code} width={40} height={40} className="object-cover w-full h-full" />
                                        ) : (
                                            <span className="text-xs text-slate-400 font-mono">#{p.id}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-900 text-sm truncate">{p.name}</div>
                                        <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">{p.code}</div>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end">
                                        {p.logoLogicalRef ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Ref: {p.logoLogicalRef}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-md border border-amber-200">
                                                Eşleşmemiş
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="text-center py-10 text-slate-400 text-sm">
                                    Sonuç bulunamadı.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MIDDLE ACTIONS */}
                <div className="flex flex-col justify-center items-center gap-4 shrink-0">
                    <Button 
                        size="lg"
                        className={cn(
                            "rounded-full w-24 h-24 flex flex-col items-center justify-center gap-2 shadow-xl transition-all duration-300",
                            selectedProductId && selectedErpRowId 
                                ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-red-600/30 text-white" 
                                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                        )}
                        disabled={!selectedProductId || !selectedErpRowId || isProcessing}
                        onClick={handleMatch}
                    >
                        {isProcessing ? (
                            <RefreshCw className="w-8 h-8 animate-spin" />
                        ) : (
                            <>
                                <LinkIcon className="w-8 h-8" />
                                <span className="text-sm font-bold tracking-wide">İŞLE</span>
                            </>
                        )}
                    </Button>
                    <div className="text-[10px] text-slate-400 font-medium text-center max-w-[100px]">
                        Eşleştirmek için iki taraftan da seçim yapın
                    </div>
                </div>

                {/* RIGHT COLUMN: Excel Data */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-w-0 relative">
                    {!erpData.length && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
                            <Upload className="w-12 h-12 text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium">Sağ üstten Excel/CSV dosyası yükleyin</p>
                        </div>
                    )}
                    
                    <div className="p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0 bg-slate-50/50 rounded-t-xl">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold text-slate-800">Yüklenen Liste <span className="text-xs font-normal text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full ml-2">{filteredErpData.length}</span></h2>
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input 
                                placeholder="Dosya içinde ara..." 
                                className="pl-9 bg-white"
                                value={erpSearch}
                                onChange={e => setErpSearch(e.target.value)}
                                disabled={!erpData.length}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                        <div className="flex flex-col gap-1">
                            {filteredErpData.map((row, idx) => {
                                const rowCode = codeColumn ? row[codeColumn] : null;
                                const rowRef = logoRefColumn ? row[logoRefColumn] : null;
                                // find a name column to display as title
                                const possibleNameCol = headers.find(h => h.toLowerCase().includes('ad') || h.toLowerCase().includes('isim') || h.toLowerCase().includes('name'));
                                const displayTitle = possibleNameCol ? row[possibleNameCol] : `Satır ${idx + 1}`;

                                return (
                                    <div 
                                        key={row._id}
                                        onClick={() => setSelectedErpRowId(row._id)}
                                        className={cn(
                                            "p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3",
                                            selectedErpRowId === row._id 
                                                ? "border-red-500 bg-red-50 ring-1 ring-red-500 shadow-sm" 
                                                : "border-slate-100 hover:border-slate-300 hover:bg-slate-50",
                                        )}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-slate-900 text-sm truncate" title={String(displayTitle)}>
                                                {displayTitle}
                                            </div>
                                            <div className="flex gap-4 mt-1">
                                                {codeColumn && (
                                                    <span className="text-xs text-slate-500 font-mono truncate">
                                                        <span className="text-slate-400 mr-1">Kod:</span>
                                                        {rowCode || '-'}
                                                    </span>
                                                )}
                                                {logoRefColumn && (
                                                    <span className="text-xs text-blue-600 font-mono truncate font-semibold">
                                                        <span className="text-slate-400 mr-1 font-normal">Ref:</span>
                                                        {rowRef || '-'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {erpData.length > 0 && filteredErpData.length === 0 && (
                                <div className="text-center py-10 text-slate-400 text-sm">
                                    Sonuç bulunamadı.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

"use client";

import React, { useEffect, useState } from "react";
import {
    Coins,
    RefreshCw,
    Save,
    TrendingUp,
    ArrowRightLeft,
    CheckCircle2,
    DollarSign,
    Euro,
    Clock,
    Sparkles,
    ShieldCheck,
    Info
} from "lucide-react";
import { exchangeRateService, ExchangeRate } from "../../services/exchangeRateService";

export default function ExchangeRatesPage() {
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [syncing, setSyncing] = useState<boolean>(false);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState<string>("");

    // Form inputs state: { [id]: number }
    const [editRates, setEditRates] = useState<{ [key: number]: string }>({});

    // Converter Calculator State
    const [calcAmount, setCalcAmount] = useState<string>("100");
    const [calcCurrency, setCalcCurrency] = useState<string>("USD");

    const loadRates = async () => {
        setLoading(true);
        try {
            const data = await exchangeRateService.getAllRates();
            setRates(data);
            const initialMap: { [key: number]: string } = {};
            data.forEach((r) => {
                initialMap[r.id] = r.rate.toString();
            });
            setEditRates(initialMap);
        } catch (error) {
            console.error("Kurlar yüklenemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRates();
    }, []);

    const handleSaveRate = async (rateObj: ExchangeRate) => {
        let valStr = editRates[rateObj.id];
        if (!valStr) {
            alert("Lütfen geçerli bir kur değeri girin.");
            return;
        }

        valStr = valStr.toString().trim().replace(",", ".");
        if (isNaN(Number(valStr)) || Number(valStr) <= 0) {
            alert("Lütfen 0'dan büyük geçerli bir kur değeri girin (örn: 36.50).");
            return;
        }

        const newRate = parseFloat(valStr);
        setSavingId(rateObj.id);
        try {
            const updated = await exchangeRateService.updateRate(rateObj.id, newRate);
            if (updated) {
                setRates((prev) => prev.map((r) => (r.id === rateObj.id ? updated : r)));
                setEditRates((prev) => ({ ...prev, [rateObj.id]: updated.rate.toString() }));
                setSuccessMessage(`${rateObj.currencyCode} kuru başarıyla (${updated.rate} ₺) olarak güncellendi!`);
                setTimeout(() => setSuccessMessage(""), 4000);
            } else {
                alert("Kur güncellenemedi. Lütfen backend bağlantısını kontrol edin.");
            }
        } catch (error) {
            console.error("Kur güncellenemedi:", error);
            alert("Kur güncellenirken bir hata oluştu.");
        } finally {
            setSavingId(null);
        }
    };

    const handleSyncLive = async () => {
        setSyncing(true);
        try {
            const updatedList = await exchangeRateService.syncLiveRates();
            if (updatedList && updatedList.length > 0) {
                setRates(updatedList);
                const initialMap: { [key: number]: string } = {};
                updatedList.forEach((r) => {
                    initialMap[r.id] = r.rate.toString();
                });
                setEditRates(initialMap);
                setSuccessMessage("Canlı piyasa kurları başarıyla senkronize edildi!");
                setTimeout(() => setSuccessMessage(""), 4000);
            }
        } catch (error) {
            console.error("Canlı kurlar çekilemedi:", error);
            alert("Canlı kurlar alınırken hata oluştu.");
        } finally {
            setSyncing(false);
        }
    };

    // Calculate conversion
    const calculatedResult = React.useMemo(() => {
        const amt = parseFloat(calcAmount) || 0;
        const targetRate = rates.find((r) => r.currencyCode === calcCurrency);
        if (!targetRate) return 0;
        return amt * targetRate.rate;
    }, [calcAmount, calcCurrency, rates]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Döviz kurları yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Coins className="w-6 h-6 text-blue-600" />
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            Döviz Kurları Yönetimi
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500">
                        USD ($) ve EUR (€) kurlarını güncelleyin; dashboard ve ürün fiyat hesaplamaları anında bu kurlara göre TL'ye dönüştürülecektir.
                    </p>
                </div>

                <button
                    onClick={handleSyncLive}
                    disabled={syncing}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                    <span>{syncing ? "Kurlar Çekiliyor..." : "Canlı Kurları Güncelle"}</span>
                </button>
            </div>

            {/* Success Alert */}
            {successMessage && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Currency Rate Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rates.map((rate) => {
                    const isTRY = rate.currencyCode === "TRY";
                    const isSaving = savingId === rate.id;
                    const currentValue = editRates[rate.id] ?? rate.rate.toString();

                    return (
                        <div
                            key={rate.id}
                            className={`p-6 rounded-2xl border transition-all ${
                                isTRY
                                    ? "bg-slate-50 border-slate-200"
                                    : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-base ${
                                            rate.currencyCode === "USD"
                                                ? "bg-emerald-100 text-emerald-800"
                                                : rate.currencyCode === "EUR"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-slate-200 text-slate-700"
                                        }`}
                                    >
                                        {rate.currencySymbol}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">{rate.currencyCode}</h3>
                                        <p className="text-xs text-slate-500 font-medium">{rate.currencyName}</p>
                                    </div>
                                </div>

                                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                                    ID: {rate.currencyId}
                                </span>
                            </div>

                            {/* Rate Display / Edit Input */}
                            <div className="my-4">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    1 {rate.currencyCode} Karşılığı (TL)
                                </label>
                                {isTRY ? (
                                    <div className="py-2.5 px-3 bg-slate-200/70 rounded-xl font-extrabold text-slate-700 text-base">
                                        1.0000 ₺ (Baz Para Birimi)
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                step="0.0001"
                                                min="0.0001"
                                                value={currentValue}
                                                onChange={(e) =>
                                                    setEditRates({ ...editRates, [rate.id]: e.target.value })
                                                }
                                                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                ₺
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleSaveRate(rate)}
                                            disabled={isSaving}
                                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            <span>{isSaving ? "..." : "Kaydet"}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Timestamp */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Son Güncelleme:
                                </span>
                                <span className="font-semibold text-slate-600">
                                    {rate.updatedAt ? new Date(rate.updatedAt).toLocaleString("tr-TR") : "Otomatik"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Currency Converter Simulator */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-base text-white">Anlık Kur Çevirici / Hesap Makinesi</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tutar</label>
                        <input
                            type="number"
                            value={calcAmount}
                            onChange={(e) => setCalcAmount(e.target.value)}
                            placeholder="100"
                            className="w-full py-2.5 px-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Para Birimi</label>
                        <select
                            value={calcCurrency}
                            onChange={(e) => setCalcCurrency(e.target.value)}
                            className="w-full py-2.5 px-3 bg-slate-800 border border-white/20 rounded-xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                        >
                            <option value="USD">USD ($ - Amerikan Doları)</option>
                            <option value="EUR">EUR (€ - Euro)</option>
                            <option value="TRY">TRY (₺ - Türk Lirası)</option>
                        </select>
                    </div>

                    <div className="bg-white/10 border border-white/15 p-2.5 rounded-xl text-center">
                        <span className="text-[11px] text-slate-300 block">TL (₺) Karşılığı</span>
                        <span className="text-xl font-extrabold text-emerald-400">
                            ₺
                            {calculatedResult.toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Information Notice */}
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-start gap-3.5 text-xs text-blue-900">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-bold">Döviz Kurları Nasıl Çalışır?</p>
                    <p className="text-blue-800 leading-relaxed">
                        Ürün kataloğundaki ürünler kendi orijinal para birimlerinde (USD, EUR, TRY) saklanır.
                        Dashboard ekranındaki <strong>Konsolide Toplam Portföy</strong> ve <strong>Depo Stok Değeri</strong> hesaplamalarında buradaki güncel kurlar kullanılarak tüm tutarlar tek bir para birimine (₺) dönüştürülür.
                    </p>
                </div>
            </div>
        </div>
    );
}

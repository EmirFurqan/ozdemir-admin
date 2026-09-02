'use client'

import React, { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { login } from '@/app/actions/auth'
import { OzdemirLogo } from '@/components/Logo'
import {
    ShieldCheck,
    ArrowRight,
    Lock,
    Mail,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Server,
    Layers
} from 'lucide-react'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium shadow-lg shadow-red-600/25 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {pending ? (
                <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Giriş Yapılıyor...
                </span>
            ) : (
                <span className="flex items-center justify-center gap-2">
                    Yönetici Girişi Yap <ArrowRight className="w-4 h-4" />
                </span>
            )}
        </Button>
    )
}

export default function Login() {
    const [state, formAction] = useActionState(login, null)
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="min-h-screen flex bg-slate-950 font-sans text-slate-100 selection:bg-red-500 selection:text-white">
            {/* Left Hero Side - Branding & Features */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/40 p-12 lg:p-16 flex-col justify-between overflow-hidden border-r border-slate-800/80">
                {/* Background Dot Pattern & Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-35" />
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-900/15 rounded-full blur-3xl pointer-events-none" />

                {/* Top Branding */}
                <div className="relative z-10 flex items-center gap-3">
                    <OzdemirLogo className="h-8 w-auto max-w-[220px]" />
                    <span className="px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                        Admin Portal
                    </span>
                </div>

                {/* Central Feature Banner */}
                <div className="relative z-10 space-y-6 max-w-lg">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                        <ShieldCheck className="w-4 h-4 text-red-500" /> Merkezi Yönetim Portalı
                    </div>

                    <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
                        Özdemir Makina Yönetici Paneli
                    </h1>

                    <p className="text-slate-400 text-sm xl:text-base leading-relaxed">
                        Ürün katalogları, dinamik iskonto oranları, bayi ağları ve sipariş operasyonlarını tek bir merkezden hızlı ve güvenle yönetin.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1">
                            <div className="flex items-center gap-2 text-white font-semibold text-sm">
                                <Layers className="w-4 h-4 text-red-400" /> Tam Denetim
                            </div>
                            <div className="text-xs text-slate-500">Ürün, grup ve kategori yönetimi</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1">
                            <div className="flex items-center gap-2 text-white font-semibold text-sm">
                                <Server className="w-4 h-4 text-red-400" /> B2B Senkronizasyonu
                            </div>
                            <div className="text-xs text-slate-500">Bayi ve sipariş entegrasyonu</div>
                        </div>
                    </div>
                </div>

                {/* Footer Copy */}
                <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between">
                    <span>© 2026 Özdemir Makina San. ve Tic. Ltd. Şti.</span>
                    <span className="text-slate-600">v2.0 Güvenli Yönetim</span>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
                {/* Subtle Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

                <div className="w-full max-w-md space-y-8 relative z-10">
                    {/* Mobile/Tablet Logo View */}
                    <div className="lg:hidden flex flex-col items-center text-center space-y-3 mb-2">
                        <OzdemirLogo className="h-8 w-auto max-w-[220px]" />
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" /> Yönetici Yönetim Paneli
                        </div>
                    </div>

                    {/* Header Text */}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Yönetici Girişi</h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Yönetim paneline erişmek için yetkili bilgilerinizi giriniz.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-7 sm:p-8 shadow-2xl backdrop-blur-md">
                        <form action={formAction} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider block" htmlFor="email">
                                    E-posta veya Kullanıcı Adı
                                </label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        name="email"
                                        type="text"
                                        placeholder="admin@ozdemirmakina.com"
                                        required
                                        className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20 h-11 rounded-xl pr-10"
                                    />
                                    <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-slate-300 uppercase tracking-wider block" htmlFor="password">
                                        Şifre
                                    </label>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        required
                                        className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20 h-11 rounded-xl pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-slate-500 hover:text-slate-300 transition-colors absolute right-3 top-1/2 -translate-y-1/2 p-1 focus:outline-none cursor-pointer"
                                        tabIndex={-1}
                                        aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {state?.message && (
                                <div
                                    className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
                                        state.success
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}
                                >
                                    {state.success ? (
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                    )}
                                    <span>{state.message}</span>
                                </div>
                            )}

                            <SubmitButton />
                        </form>
                    </div>

                    {/* Security Notice */}
                    <div className="text-center p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-500 flex items-center justify-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Bu panel yalnızca yetkili sistem yöneticilerinin erişimine açıktır.</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

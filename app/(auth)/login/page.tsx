'use client'

import React, { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { login } from '@/app/actions/auth'
import Image from 'next/image'
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full h-11 bg-red-600 hover:bg-red-500 text-white font-medium shadow-lg shadow-red-600/20 rounded-xl transition-all duration-200"
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-sans relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="text-center flex flex-col items-center">
                    <div className="relative w-12 h-12 mb-3">
                        <Image src="/LogoOBeyaz.svg" alt="Özdemir Logo" fill className="object-contain" />
                    </div>
                    <div className="relative h-6 w-36 mb-2">
                        <Image src="/OzdemirLogoBeyaz.svg" alt="Özdemir Makina" fill className="object-contain" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mt-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Yönetici Yönetim Paneli
                    </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
                    <form action={formAction} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider" htmlFor="email">
                                E-posta veya Kullanıcı Adı
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="text"
                                placeholder="admin@ozdemirmakina.com"
                                required
                                className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20 h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider" htmlFor="password">
                                    Şifre
                                </label>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20 h-11 rounded-xl"
                            />
                        </div>

                        {state?.message && (
                            <div className={`p-4 rounded-xl text-xs font-medium ${state.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                {state.message}
                            </div>
                        )}

                        <SubmitButton />
                    </form>
                </div>

                <div className="text-center text-xs text-slate-600">
                    © 2026 Özdemir Makina San. ve Tic. Ltd. Şti. Güvenli Yönetim Sistemi
                </div>
            </div>
        </div>
    )
}

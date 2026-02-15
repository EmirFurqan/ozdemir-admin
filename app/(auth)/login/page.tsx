'use client'

import React, { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { login } from '@/app/actions/auth'
import Link from 'next/link'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </Button>
    )
}

export default function Login() {
    const [state, formAction] = useActionState(login, null)

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Özdemir Makina</h2>
                    <p className="text-muted-foreground">Bayi/Müşteri Paneline Giriş Yapın</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                    <form action={formAction} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground" htmlFor="email">
                                E-posta Adresi
                            </label>
                            <Input id="email" name="email" type="email" placeholder="ornek@sirket.com" required />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground" htmlFor="password">
                                    Şifre
                                </label>
                                <a href="#" className="text-sm font-medium text-primary hover:text-primary/80">
                                    Şifrenizi mi unuttunuz?
                                </a>
                            </div>
                            <Input id="password" name="password" type="password" required />
                        </div>

                        {state?.message && (
                            <div className={`p-3 rounded-md text-sm ${state.success ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}`}>
                                {state.message}
                            </div>
                        )}

                        <SubmitButton />
                    </form>
                </div>

                <p className="px-8 text-center text-sm text-muted-foreground">
                    Hesabınız yok mu?{' '}
                    <Link href="/register" className="underline underline-offset-4 hover:text-primary text-foreground">
                        Kayıt Olun
                    </Link>
                </p>
            </div>
        </div>
    )
}

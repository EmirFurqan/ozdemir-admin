'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'


const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api') + '/auth'


export async function login(prevState, formData) {
    const email = formData.get('email')
    const password = formData.get('password')

    try {
        // 1. Authenticate to get token
        const response = await fetch(`${BACKEND_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: email, password }),
        })

        if (!response.ok) {
            return { success: false, message: 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.' }
        }

        const data = await response.json()
        const token = data.token

        // 2. Verify Admin Role IMMEDIATELY
        const adminCheck = await fetch(`${BACKEND_URL}/admin/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!adminCheck.ok) {
            return { success: false, message: 'Giriş reddedildi: Bu panele sadece yöneticiler erişebilir.' }
        }

        // 3. Set Cookie only if verified
        const cookieStore = await cookies()
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        })
    } catch (error) {
        console.error('Login error:', error)
        return { success: false, message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' }
    }

    redirect('/')
}


export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('token')
    redirect('/login')
}

export async function getUser() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')

    if (!token) {
        return null
    }

    try {
        const response = await fetch(`${BACKEND_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token.value}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            console.error('Failed to fetch user:', response.status, response.statusText)
            return null
        }

        const user = await response.json()
        return user
    } catch (error) {
        console.error('Error fetching user:', error)
        return null
    }
}


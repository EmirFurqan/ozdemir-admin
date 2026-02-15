// import { cookies } from "next/headers"; // Removed static import

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api";

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    // Determine if we are on the server
    const isServer = typeof window === 'undefined';
    let token = null;

    if (isServer) {
        try {
            const { cookies } = await import("next/headers");
            const cookieStore = await cookies();
            token = cookieStore.get('token')?.value;
        } catch (e) {
            // Ignore error if cookies() is called outside of request context (e.g. static generation)
            // console.warn("Could not access cookies:", e);
        }
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!res.ok) {
            // Handle 401/403 by returning null (user not logged in)
            if (res.status === 401 || res.status === 403) {
                return null;
            }

            console.error(`[API] Failed: ${res.status} ${res.statusText} for ${API_BASE_URL}${endpoint}`);
            if (res.status !== 404) {
                const body = await res.text();
                console.error(`[API] Response body: ${body}`);
            }

            // Return null or throw depending on need. For now throw to handle in catch blocks
            throw new Error(`API call failed: ${res.status} ${res.statusText}`);
        }

        // Handle empty responses
        if (res.status === 204) return null;

        return res.json();
    } catch (error) {
        console.error(`[API] Network or Parse Error:`, error);
        throw error;
    }
}

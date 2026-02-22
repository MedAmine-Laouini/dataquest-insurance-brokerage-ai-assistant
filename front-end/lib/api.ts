const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function getApiUrl(path: string): string {
    return `${API_URL}${path}`
}

export function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('marcos_token') : null
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    return headers
}

export async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(getApiUrl(path), {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options?.headers,
        },
    })

    if (res.status === 401) {
        // Token expired or invalid — clear session
        if (typeof window !== 'undefined') {
            localStorage.removeItem('marcos_token')
            localStorage.removeItem('marcos_user')
            window.location.href = '/login'
        }
        throw new Error('Unauthorized')
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Request failed: ${res.status}`)
    }

    return res.json()
}

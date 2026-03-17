import axios from 'axios'

// Create a configured Axios instance
const api = axios.create({
    // Use the backend URL from environment variables, fallback to local FastAPI default port
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request Interceptor: Inject Auth Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response Interceptor: Handle global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        if (error.response?.status === 401) {
            // Auto-logout logic could go here
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api

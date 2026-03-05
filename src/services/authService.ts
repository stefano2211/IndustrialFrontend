import api from './api'

export const authService = {
    async login(credentials: { email: string; password: string }) {
        // Backend /auth/login expects a JSON body (UserLogin model)
        const response = await api.post('/auth/login', {
            email: credentials.email,
            password: credentials.password
        })

        // Response should be {"access_token": "...", "token_type": "bearer"}
        return response.data
    },

    async register(data: { name?: string; email: string; password: string }) {
        // FastAPI expects JSON for registration including a username
        const response = await api.post('/auth/register', {
            username: data.name || data.email, // Backend requires a username field
            email: data.email,
            password: data.password
        })
        return response.data
    }
}

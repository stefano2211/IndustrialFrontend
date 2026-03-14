import api from './api'

export interface SystemStats {
    active_users: number
    total_conversations: number
    status: string
}

export const systemService = {
    async getStats(): Promise<SystemStats> {
        const response = await api.get('/system/stats')
        return response.data
    }
}

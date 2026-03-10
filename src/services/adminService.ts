import api from './api'

export interface AdminUser {
    id: string
    username: string
    email: string
    is_active: boolean
    is_superuser: boolean
    created_at: string
    updated_at: string
}

export interface DailyMessages {
    date: string
    count: number
}

export interface ModelUsageItem {
    rank: number
    model: string
    messages: number
    tokens: number
    percentage: number
}

export interface UserActivityItem {
    rank: number
    username: string
    email: string
    messages: number
    tokens: number
}

export interface AnalyticsData {
    total_messages: number
    total_tokens: number
    total_chats: number
    total_users: number
    daily_messages: DailyMessages[]
    model_usage: ModelUsageItem[]
    user_activity: UserActivityItem[]
}

export interface SystemSettingsGeneral {
    auth_default_user_role: string
    auth_enable_sign_ups: boolean
    feature_enable_api_keys: boolean
    feature_jwt_expiration: string
    feature_enable_community_sharing: boolean
}

export interface SystemSettings {
    document_chunk_size: number
    document_chunk_overlap: number
    retrieval_search_results: number
}

export const adminService = {
    async listUsers(): Promise<AdminUser[]> {
        const response = await api.get('/admin/users')
        return response.data
    },

    async updateUserRole(userId: string, isSuperuser: boolean): Promise<AdminUser> {
        const response = await api.put(`/admin/users/${userId}/role`, { is_superuser: isSuperuser })
        return response.data
    },

    async deleteUser(userId: string): Promise<void> {
        await api.delete(`/admin/users/${userId}`)
    },

    async getAnalytics(days: number = 7): Promise<AnalyticsData> {
        const response = await api.get(`/admin/stats?days=${days}`)
        return response.data
    },

    async getGeneralSettings(): Promise<SystemSettingsGeneral> {
        const response = await api.get('/admin/settings/general')
        return response.data
    },

    async updateGeneralSettings(settings: SystemSettingsGeneral): Promise<SystemSettingsGeneral> {
        const response = await api.put('/admin/settings/general', settings)
        return response.data
    },

    async getSettings(): Promise<SystemSettings> {
        const response = await api.get('/admin/settings/documents')
        return response.data
    },

    async updateSettings(settings: SystemSettings): Promise<SystemSettings> {
        const response = await api.put('/admin/settings/documents', settings)
        return response.data
    }
}

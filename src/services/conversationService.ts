import api from './api'

export interface Conversation {
    id: string
    thread_id: string
    title: string
    created_at: string
    updated_at: string
}

export interface MessageItem {
    role: 'user' | 'assistant'
    content: string
}

export const conversationService = {
    async list(): Promise<Conversation[]> {
        const response = await api.get('/conversations')
        return response.data
    },

    async create(title: string = 'New Chat'): Promise<Conversation> {
        const response = await api.post('/conversations', { title })
        return response.data
    },

    async getMessages(threadId: string): Promise<MessageItem[]> {
        const response = await api.get(`/conversations/${threadId}/messages`)
        return response.data
    },

    async remove(threadId: string): Promise<void> {
        await api.delete(`/conversations/${threadId}`)
    }
}

import api from './api'

export const chatService = {
    async sendMessage(query: string, threadId?: string) {
        const response = await api.post('/chat', {
            query,
            thread_id: threadId
        })

        // Expected response shape from backend: ChatResponse
        return response.data
    }
}

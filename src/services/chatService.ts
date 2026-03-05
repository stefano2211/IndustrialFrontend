import api from './api'

export const chatService = {
    async sendMessage(query: string, threadId?: string, knowledgeBaseId?: string) {
        // Use a longer timeout (120 seconds) for LLM chat requests
        const response = await api.post('/chat', {
            query,
            thread_id: threadId,
            knowledge_base_id: knowledgeBaseId
        }, { timeout: 540000 }) // 9 minutos (9 * 60 * 1000)

        // Expected response shape from backend: ChatResponse
        return response.data
    }
}

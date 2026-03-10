import api from './api'

export const chatService = {
    // Non-streaming fallback
    async sendMessage(query: string, threadId?: string, knowledgeBaseId?: string) {
        const response = await api.post('/chat', {
            query,
            thread_id: threadId,
            knowledge_base_id: knowledgeBaseId
        }, { timeout: 540000 })
        return response.data
    },

    // Streaming via SSE
    async sendMessageStream(
        query: string,
        threadId: string | undefined,
        knowledgeBaseId: string | undefined,
        params: Record<string, any> | undefined,
        onToken: (token: string) => void,
        onMeta: (meta: { thread_id: string }) => void,
        onDone: (fullContent: string) => void,
        onError: (error: string) => void
    ): Promise<void> {
        const token = localStorage.getItem('token')
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

        const response = await fetch(`${baseURL}/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                query,
                thread_id: threadId,
                knowledge_base_id: knowledgeBaseId,
                params: params || undefined,
            }),
        })

        if (!response.ok) {
            onError(`HTTP ${response.status}`)
            return
        }

        const reader = response.body?.getReader()
        if (!reader) {
            onError('No readable stream')
            return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6))
                        if (data.type === 'token') {
                            onToken(data.content)
                        } else if (data.type === 'meta') {
                            onMeta(data)
                        } else if (data.type === 'done') {
                            onDone(data.full_content)
                        } else if (data.type === 'error') {
                            onError(data.detail)
                        }
                    } catch (e) {
                        // Skip malformed JSON lines
                    }
                }
            }
        }
    }
}

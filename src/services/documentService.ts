import api from './api'

export const documentService = {
    async uploadFile(file: File, knowledgeBaseId?: string) {
        const formData = new FormData()
        formData.append('file', file)
        if (knowledgeBaseId) {
            formData.append('knowledge_base_id', knowledgeBaseId)
        }

        const response = await api.post('/api/v1/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })

        return response.data
    },

    async getStatus(docId: string) {
        const response = await api.get(`/api/v1/documents/${docId}`)
        // Adapt backend DocumentOut to frontend expected shape
        const doc = response.data
        return {
            status: doc.status === 'uploaded' ? 'PENDING' : (doc.status === 'processing' ? 'PROGRESS' : 'SUCCESS'),
            info: { status: doc.status }
        }
    },

    async deleteDocument(docId: string) {
        const response = await api.delete(`/api/v1/documents/${docId}`)
        return response.data
    }
}

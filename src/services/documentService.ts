import api from './api'

export const documentService = {
    async uploadFile(file: File, knowledgeBaseId?: string) {
        const formData = new FormData()
        formData.append('file', file)
        if (knowledgeBaseId) {
            formData.append('knowledge_base_id', knowledgeBaseId)
        }

        const response = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })

        return response.data
    },

    async getStatus(taskId: string) {
        const response = await api.get(`/status/${taskId}`)
        return response.data
    },

    async deleteDocument(docId: string) {
        const response = await api.delete(`/documents/${docId}`)
        return response.data
    }
}

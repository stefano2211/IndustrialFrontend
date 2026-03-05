import api from './api'

export const documentService = {
    async uploadFile(file: File) {
        const formData = new FormData()
        formData.append('file', file)

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
    }
}

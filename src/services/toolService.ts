import api from './api'

export interface ToolConfig {
    id: number
    name: string
    description: string
    is_enabled: boolean
    config: any
}

export interface ToolConfigUpdate {
    name?: string
    description?: string
    is_enabled?: boolean
    config?: any
}

const toolService = {
    async listTools(): Promise<ToolConfig[]> {
        const response = await api.get('/tools/')
        return response.data
    },

    async getTool(id: number): Promise<ToolConfig> {
        const response = await api.get(`/tools/${id}`)
        return response.data
    },

    async createTool(tool: Partial<ToolConfig>): Promise<ToolConfig> {
        const response = await api.post('/tools/', tool)
        return response.data
    },

    async updateTool(id: number, tool: ToolConfigUpdate): Promise<ToolConfig> {
        const response = await api.put(`/tools/${id}`, tool)
        return response.data
    },

    async deleteTool(id: number): Promise<void> {
        await api.delete(`/tools/${id}`)
    }
}

export default toolService

import api from './api'

export interface ModelConfig {
    role: string
    provider: string
    model_name: string
}

export interface ModelConfigUpdate {
    provider?: string
    model_name?: string
}

const modelService = {
    async listConfigs(): Promise<ModelConfig[]> {
        const response = await api.get('/models/')
        return response.data
    },

    async getConfig(role: string): Promise<ModelConfig> {
        const response = await api.get(`/models/${role}`)
        return response.data
    },

    async setConfig(role: string, config: ModelConfigUpdate): Promise<ModelConfig> {
        // Use PUT for set_config
        const response = await api.put(`/models/${role}`, config)
        return response.data
    },

    async updateConfig(role: string, config: ModelConfigUpdate): Promise<ModelConfig> {
        const response = await api.patch(`/models/${role}`, config)
        return response.data
    }
}

export default modelService

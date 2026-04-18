import api from './api'

export interface TrainingRequest {
  tenant_id: string
  epochs: number
  webhook_url?: string
  base_model?: string  // Modelo base para entrenar (ej: "Qwen/Qwen3.5-2B")
}

export interface VLTrainingRequest {
  tenant_id: string
  vl_epochs: number
  text_epochs: number
  webhook_url?: string
  base_model?: string  // Modelo base VL para entrenar
}

const mlopsService = {
  async launchTraining(payload: TrainingRequest): Promise<any> {
    const response = await api.post('/mlops/training/launch', payload)
    return response.data
  },

  async launchVLTraining(payload: VLTrainingRequest): Promise<any> {
    const response = await api.post('/mlops/training/launch-vl', payload)
    return response.data
  }
}

export default mlopsService

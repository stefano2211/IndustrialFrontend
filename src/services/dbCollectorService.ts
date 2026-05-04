import api from './api'

export interface DbSource {
  id: string
  name: string
  description?: string
  db_type: string
  query: string
  cron_expression: string
  is_enabled: boolean
  tenant_id: string
  sector?: string
  domain?: string
  last_run_at?: string
  last_run_status?: string
  last_run_rows?: number
  last_error?: string
  created_at?: string
}

export default {
  async listSources(): Promise<DbSource[]> {
    const res = await api.get('/api/v1/db-sources')
    return res.data
  },

  async createSource(data: Partial<DbSource> & { connection_string: string }): Promise<DbSource> {
    const res = await api.post('/api/v1/db-sources', data)
    return res.data
  },

  async updateSource(id: string, data: Partial<DbSource> & { connection_string?: string }): Promise<DbSource> {
    const res = await api.put(`/api/v1/db-sources/${id}`, data)
    return res.data
  },

  async deleteSource(id: string): Promise<void> {
    await api.delete(`/api/v1/db-sources/${id}`)
  },

  async runSource(id: string): Promise<{ status: string; message: string }> {
    const res = await api.post(`/api/v1/db-sources/${id}/run`)
    return res.data
  },

  async runAll(): Promise<{ status: string; message: string }> {
    const res = await api.post('/api/v1/db-sources/run-all')
    return res.data
  },

  async getSourceStatus(id: string): Promise<DbSource> {
    const res = await api.get(`/api/v1/db-sources/${id}/status`)
    return res.data
  }
}


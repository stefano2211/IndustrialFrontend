import api from './api'

export type EventSeverity = 'low' | 'medium' | 'high' | 'critical'
export type EventStatus =
  | 'pending'
  | 'analyzing'
  | 'awaiting_approval'
  | 'executing'
  | 'completed'
  | 'failed'
export type EventSourceType = 'sensor' | 'db_collector' | 'manual' | 'webhook'

export interface IndustrialEvent {
  id: string
  tenant_id: string
  source_type: EventSourceType
  severity: EventSeverity
  status: EventStatus
  title: string
  description: string
  raw_payload?: Record<string, any>
  agent_analysis?: string
  agent_plan?: string
  actions_taken?: any[]
  created_at: string
  updated_at: string
  resolved_at?: string
  triggered_by_user_id?: string
}

export interface EventListResponse {
  total: number
  items: IndustrialEvent[]
}

export interface EventFilters {
  severity?: EventSeverity
  status?: EventStatus
  source_type?: EventSourceType
  limit?: number
  offset?: number
}

export interface ManualEventPayload {
  severity: EventSeverity
  title: string
  description: string
  raw_payload?: Record<string, any>
}

export interface ApprovalPayload {
  notes?: string
}

const eventService = {
  async listEvents(filters: EventFilters = {}): Promise<EventListResponse> {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null)
    )
    const res = await api.get('/events', { params })
    return res.data
  },

  async getEvent(id: string): Promise<IndustrialEvent> {
    const res = await api.get(`/events/${id}`)
    return res.data
  },

  async createManualEvent(payload: ManualEventPayload): Promise<IndustrialEvent> {
    const res = await api.post('/events/manual', payload)
    return res.data
  },

  async approveEvent(id: string, payload: ApprovalPayload = {}): Promise<IndustrialEvent> {
    const res = await api.post(`/events/${id}/approve`, payload)
    return res.data
  },

  async rejectEvent(id: string, payload: ApprovalPayload = {}): Promise<IndustrialEvent> {
    const res = await api.post(`/events/${id}/reject`, payload)
    return res.data
  },

  /**
   * Opens a Server-Sent Events connection to /events/stream.
   * Returns the EventSource instance so the caller can close it.
   */
  openSSEStream(
    onMessage: (payload: any) => void,
    onError?: (err: Event) => void
  ): EventSource {
    const token = localStorage.getItem('token')
    // In dev mode use a relative URL so Vite's proxy handles the request (same-origin).
    // In production, use the configured VITE_API_URL.
    const baseURL = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || '') : ''
    const url = `${baseURL}/events/stream`

    // EventSource doesn't support headers natively — we inject the token as a
    // query param and the backend reads it from there, or we rely on the cookie/
    // existing session. For Bearer-token APIs a common workaround is a short-lived
    // ticket endpoint; here we append it as a query param for simplicity.
    const es = new EventSource(`${url}?token=${token}`)
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        onMessage(data)
      } catch {
        // heartbeat or non-JSON frame — ignore
      }
    }
    if (onError) es.onerror = onError
    return es
  },
}

export default eventService

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
  agent_reasoning?: string
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

// ═══════════════════════════════════════════════════════════════════════════════
//  SYNTHETIC PRESETS — Quick-trigger templates for testing
//  These are ONLY input data. Analysis, plans, and execution are handled
//  by the real backend AI pipeline (System 1 & 2 → LLM Planner → VLM).
// ═══════════════════════════════════════════════════════════════════════════════

export interface SyntheticPreset {
  id: string
  label: string
  icon: string
  severity: EventSeverity
  title: string
  description: string
  raw_payload: Record<string, any>
}

export const SYNTHETIC_PRESETS: SyntheticPreset[] = [
  {
    id: 'boiler_pressure',
    label: 'Sobrepresión de Caldera',
    icon: '🔴',
    severity: 'critical',
    title: 'Presión de caldera excede límite operacional (PSI > 320)',
    description: 'El sensor PT-4401 en la caldera principal reporta lecturas de 327 PSI, superando el umbral crítico de 320 PSI. Se recomienda reducción inmediata de carga térmica.',
    raw_payload: {
      sensor_id: 'PT-4401',
      value: 327.4,
      unit: 'PSI',
      threshold: 320,
      location: 'Boiler Room A — Main Steam Header',
      timestamp: new Date().toISOString(),
    },
  },
  {
    id: 'coolant_flow',
    label: 'Flujo de Refrigerante',
    icon: '🟠',
    severity: 'high',
    title: 'Anomalía en tasa de flujo de refrigerante — Línea 2',
    description: 'Desviación del 18% en la tasa de flujo de refrigerante respecto al baseline histórico de 30 días.',
    raw_payload: {
      metric: 'coolant_flow_rate',
      current_value: 42.3,
      baseline_avg: 51.6,
      deviation_pct: -18.0,
      unit: 'L/min',
      line: 'Production Line 2',
      collector: 'db_collector_postgres_historian',
    },
  },
  {
    id: 'compressor_vibration',
    label: 'Vibración de Compresor',
    icon: '🟡',
    severity: 'medium',
    title: 'Vibración elevada en motor de compresor MC-101',
    description: 'Sensor de vibración VS-101 reporta 8.2 mm/s RMS, superando el umbral de alerta de 7.1 mm/s.',
    raw_payload: {
      sensor_id: 'VS-101',
      value: 8.2,
      unit: 'mm/s RMS',
      threshold_alert: 7.1,
      threshold_critical: 11.0,
      equipment: 'Compressor Motor MC-101',
      location: 'Compressor House — Bay 3',
    },
  },
  {
    id: 'ph_calibration',
    label: 'Calibración de pH',
    icon: '🟢',
    severity: 'low',
    title: 'Verificación rutinaria de calibración — Sensor de pH',
    description: 'Operador solicita verificación de calibración del sensor de pH en torre de enfriamiento CT-01.',
    raw_payload: {
      sensor_id: 'pH-CT01',
      last_calibration: new Date(Date.now() - 30 * 86400000).toISOString(),
      current_reading: 7.2,
      expected_range: '7.0 - 7.5',
    },
  },
  {
    id: 'plc_comm_failure',
    label: 'Falla PLC',
    icon: '🔴',
    severity: 'high',
    title: 'Falla de comunicación PLC — Estación de empaque EP-03',
    description: 'El PLC de la estación de empaque EP-03 perdió comunicación con el servidor OPC durante 45 segundos.',
    raw_payload: {
      plc_id: 'PLC-EP03',
      downtime_seconds: 45,
      opc_server: 'OPC-UA-MAIN',
      reconnect_attempts: 3,
      resolved: false,
    },
  },
  {
    id: 'h2s_gas',
    label: 'Detección de Gas H₂S',
    icon: '☠️',
    severity: 'critical',
    title: 'Detección de gas H₂S en zona de proceso — Alarma Nivel 2',
    description: 'Detector de gas GD-7701 detectó concentración de 12 ppm de H₂S, superando el límite TWA de 10 ppm.',
    raw_payload: {
      detector_id: 'GD-7701',
      gas: 'H2S',
      concentration_ppm: 12,
      limit_twa: 10,
      limit_stel: 15,
      location: 'Process Area — Desulfurization Unit',
      wind_direction: 'NNW',
      wind_speed_kmh: 8,
    },
  },
  {
    id: 'transformer_temp',
    label: 'Temperatura de Transformador',
    icon: '🟡',
    severity: 'medium',
    title: 'Temperatura anómala en transformador eléctrico TR-02',
    description: 'Sensor de temperatura TT-TR02 reporta 78°C en devanado primario, 8°C por encima del promedio operacional.',
    raw_payload: {
      sensor_id: 'TT-TR02',
      value: 78,
      unit: '°C',
      baseline_avg: 70,
      equipment: 'Power Transformer TR-02',
      location: 'Electrical Substation — Zone B',
    },
  },
  {
    id: 'send_gmail',
    label: 'Enviar Gmail de Prueba',
    icon: '📧',
    severity: 'medium',
    title: 'Send test Gmail from Digital Optimus to erastellius@gmail.com',
    description: 'Enviar un correo electrónico de prueba desde la cuenta de Digital Optimus hacia erastellius@gmail.com para verificar conectividad de servicios de comunicación.',
    raw_payload: {
      task_type: 'email_automation',
      target_email: 'erastellius@gmail.com',
      subject: 'Test from Digital Optimus',
      body: 'This is an automated test email sent by the Digital Optimus industrial agent system.',
      service: 'Gmail',
    },
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
//  SERVICE — All calls go to the REAL backend.
//  Synthetic presets are just convenient payloads to feed into the real API.
// ═══════════════════════════════════════════════════════════════════════════════

const eventService = {
  /**
   * Returns the list of synthetic presets for the UI quick-trigger panel.
   */
  getSyntheticPresets(): SyntheticPreset[] {
    return SYNTHETIC_PRESETS
  },

  /**
   * Fires a synthetic preset through the REAL backend pipeline.
   * This calls POST /events/manual with the preset data — the backend
   * will run System 1 & 2 analysis, generate a real plan, and wait
   * for human approval before executing via VLM.
   */
  async triggerPreset(preset: SyntheticPreset): Promise<IndustrialEvent> {
    return this.createManualEvent({
      severity: preset.severity,
      title: preset.title,
      description: preset.description,
      raw_payload: {
        ...preset.raw_payload,
        _synthetic: true,
        _preset_id: preset.id,
        timestamp: new Date().toISOString(),
      },
    })
  },

  // ── Standard CRUD — always real backend ──────────────────────────────────

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

  // ── SSE — always real backend ────────────────────────────────────────────

  openSSEStream(
    onMessage: (payload: any) => void,
    onError?: (err: Event) => void
  ): EventSource | null {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('[SSE] No auth token found — skipping stream connection.')
      return null
    }
    const baseURL = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || '') : ''
    const url = `${baseURL}/events/stream`

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

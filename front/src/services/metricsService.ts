import { API_URL } from '@/lib/apiConfig'
import { createRequest } from '@/lib/apiUtils'

export interface PrometheusMetric {
  name: string
  help: string
  type: 'counter' | 'gauge' | 'histogram' | 'summary'
  samples: Array<{
    labels: Record<string, string>
    value: number
  }>
}

export interface ParsedMetrics {
  httpRequests: {
    total: number
    byStatus: Record<string, number>
    duration: {
      p50: number
      p95: number
      p99: number
    }
  }
  tasks: {
    total: number
    active: number
    byStatus: Record<string, number>
  }
  watchlist: {
    activeAuthors: number
  }
  vkApi: {
    total: number
    byStatus: Record<string, number>
    duration: {
      p50: number
      p95: number
    }
  }
  system: {
    memory: {
      heapUsed: number
      heapTotal: number
      rss: number
    }
    cpu: {
      user: number
      system: number
    }
  }
}

export const metricsService = {
  async fetchMetrics(): Promise<string> {
    const response = await createRequest(`${API_URL}/metrics`)
    if (!response.ok) {
      throw new Error('Failed to fetch metrics')
    }
    return response.text()
  },

  parsePrometheusMetrics(text: string): ParsedMetrics {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const metrics: Record<string, PrometheusMetric> = {}
    const pendingHelp: Record<string, string> = {}

    let currentMetric: PrometheusMetric | null = null

    for (const line of lines) {
      if (line.startsWith('# HELP ')) {
        const match = line.match(/^# HELP ([^ ]+) (.+)$/)
        if (match) {
          const [, name, help] = match
          pendingHelp[name] = help
          if (metrics[name]) {
            metrics[name].help = help
          }
        }
        continue
      }

      if (line.startsWith('# TYPE ')) {
        const match = line.match(/^# TYPE ([^ ]+) (\w+)$/)
        if (match) {
          const [, name, type] = match
          currentMetric = metrics[name] ?? {
            name,
            help: pendingHelp[name] || '',
            type: type as PrometheusMetric['type'],
            samples: [],
          }
          currentMetric.type = type as PrometheusMetric['type']
          currentMetric.help = currentMetric.help || pendingHelp[name] || ''
          metrics[name] = currentMetric
        }
        continue
      }

      if (!line.includes(' ')) {
        continue
      }

      const parts = line.split(' ')
      if (parts.length < 2) {
        continue
      }

      const valueStr = parts[parts.length - 1]
      const labelsStr = parts.slice(0, -1).join(' ')
      const value = parseFloat(valueStr)

      if (isNaN(value)) {
        continue
      }

      const labels: Record<string, string> = {}
      const labelMatch = labelsStr.match(/\{([^}]+)\}/)
      if (labelMatch) {
        labelMatch[1].split(',').forEach((pair) => {
          const [key, val] = pair.split('=')
          if (key && val) {
            labels[key.trim()] = val.trim().replace(/^"|"$/g, '')
          }
        })
      }

      const nameMatch = labelsStr.match(/^([^{\s]+)/)
      const metricName = nameMatch ? nameMatch[1] : null
      let targetMetric = currentMetric

      if (metricName && metrics[metricName]) {
        targetMetric = metrics[metricName]
      } else if (!targetMetric && metricName) {
        targetMetric = {
          name: metricName,
          help: pendingHelp[metricName] || '',
          type: 'gauge',
          samples: [],
        }
        metrics[metricName] = targetMetric
      }

      if (targetMetric) {
        targetMetric.samples.push({ labels, value })
      }
    }

    return this.transformMetrics(metrics)
  },

  transformMetrics(metrics: Record<string, PrometheusMetric>): ParsedMetrics {
    const httpRequestsTotal = metrics['http_requests_total']?.samples || []
    const httpRequestDuration = metrics['http_request_duration_seconds']?.samples || []
    const tasksTotal = metrics['tasks_total']?.samples || []
    const tasksActive = metrics['tasks_active']?.samples[0]?.value || 0
    const watchlistActive = metrics['watchlist_authors_active']?.samples[0]?.value || 0
    const vkApiRequests = metrics['vk_api_requests_total']?.samples || []
    const vkApiDuration = metrics['vk_api_request_duration_seconds']?.samples || []

    const processMemory = metrics['process_resident_memory_bytes']?.samples[0]?.value || 0
    const heapUsed = metrics['nodejs_heap_size_used_bytes']?.samples[0]?.value || 0
    const heapTotal = metrics['nodejs_heap_size_total_bytes']?.samples[0]?.value || 0
    const cpuUser = metrics['process_cpu_user_seconds_total']?.samples[0]?.value || 0
    const cpuSystem = metrics['process_cpu_system_seconds_total']?.samples[0]?.value || 0

    const httpByStatus: Record<string, number> = {}
    let httpTotal = 0
    httpRequestsTotal.forEach((sample) => {
      const status = sample.labels.status || 'unknown'
      httpByStatus[status] = (httpByStatus[status] || 0) + sample.value
      httpTotal += sample.value
    })

    const durations = httpRequestDuration.map((s) => s.value).sort((a, b) => a - b)
    const p50 = durations[Math.floor(durations.length * 0.5)] || 0
    const p95 = durations[Math.floor(durations.length * 0.95)] || 0
    const p99 = durations[Math.floor(durations.length * 0.99)] || 0

    const tasksByStatus: Record<string, number> = {}
    let tasksTotalCount = 0
    tasksTotal.forEach((sample) => {
      const status = sample.labels.status || 'unknown'
      tasksByStatus[status] = (tasksByStatus[status] || 0) + sample.value
      tasksTotalCount += sample.value
    })

    const vkApiByStatus: Record<string, number> = {}
    let vkApiTotal = 0
    vkApiRequests.forEach((sample) => {
      const status = sample.labels.status || 'unknown'
      vkApiByStatus[status] = (vkApiByStatus[status] || 0) + sample.value
      vkApiTotal += sample.value
    })

    const vkDurations = vkApiDuration.map((s) => s.value).sort((a, b) => a - b)
    const vkP50 = vkDurations[Math.floor(vkDurations.length * 0.5)] || 0
    const vkP95 = vkDurations[Math.floor(vkDurations.length * 0.95)] || 0

    return {
      httpRequests: {
        total: httpTotal,
        byStatus: httpByStatus,
        duration: { p50, p95, p99 },
      },
      tasks: {
        total: tasksTotalCount,
        active: tasksActive,
        byStatus: tasksByStatus,
      },
      watchlist: {
        activeAuthors: watchlistActive,
      },
      vkApi: {
        total: vkApiTotal,
        byStatus: vkApiByStatus,
        duration: { p50: vkP50, p95: vkP95 },
      },
      system: {
        memory: {
          heapUsed: heapUsed / 1024 / 1024,
          heapTotal: heapTotal / 1024 / 1024,
          rss: processMemory / 1024 / 1024,
        },
        cpu: {
          user: cpuUser,
          system: cpuSystem,
        },
      },
    }
  },
}

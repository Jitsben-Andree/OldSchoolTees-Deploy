export interface SystemStatus {
  app: string;
  database: string;
}

export interface SystemMetrics {
  memory_total_mb: number;
  memory_used_mb: number;
  memory_free_mb: number;
  uptime_human: string;
  uptime_millis: number;
  processors_available: number;
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SystemMetrics, SystemStatus } from '../interface/monitoring';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {

  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  //  MONITOREO 
  getSystemStatus(): Observable<SystemStatus> {
    return this.http.get<any>(`${this.baseUrl}/actuator/health`).pipe(
      map(response => ({
        app: response.status,
        database: response.components?.db?.status || 'UNKNOWN' 
      })),
      catchError(() => of({ app: 'DOWN', database: 'DOWN' }))
    );
  }

  getSystemMetrics(): Observable<SystemMetrics> {
    const uptime$ = this.http.get<any>(`${this.baseUrl}/actuator/metrics/process.uptime`);
    const memoryUsed$ = this.http.get<any>(`${this.baseUrl}/actuator/metrics/jvm.memory.used`);
    const memoryMax$ = this.http.get<any>(`${this.baseUrl}/actuator/metrics/jvm.memory.max`);
    const processors$ = this.http.get<any>(`${this.baseUrl}/actuator/metrics/system.cpu.count`);

    return forkJoin([uptime$, memoryUsed$, memoryMax$, processors$]).pipe(
      map(([uptimeRes, memUsedRes, memMaxRes, procRes]) => {
        return {
          memory_total_mb: Math.round(memMaxRes.measurements[0].value / (1024 * 1024)),
          memory_used_mb: Math.round(memUsedRes.measurements[0].value / (1024 * 1024)),
          memory_free_mb: 0,
          uptime_human: this.formatUptime(uptimeRes.measurements[0].value),
          uptime_millis: 0,
          processors_available: procRes.measurements[0].value
        };
      })
    );
  }

  getRecentLogs(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/admin/logs/recent`);
  }

  downloadLogFile(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/admin/logs/download`, { responseType: 'blob' });
  }

  //  TAREAS CON DESCARGA DE REPORTE 
  triggerCleanup(): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/admin/tasks/cleanup-tokens`, {}, { responseType: 'blob' });
  }

  triggerCancelOrders(): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/admin/tasks/cancel-orders`, {}, { responseType: 'blob' });
  }

  triggerSalesReport(): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/admin/tasks/sales-report`, {}, { responseType: 'blob' });
  }

  //  TAREA DE BACKUP (SIN DESCARGA) 
  triggerBackup(): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/tasks/backup-db`, {});
  }

  private formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  }
}
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitoringService } from '../../../core/services/monitoring';
import { SystemMetrics, SystemStatus } from '../../../core/interface/monitoring';
import { Subscription, interval } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-logs.html',
})
export class AdminLogsComponent implements OnInit, OnDestroy {

  status: SystemStatus | null = null;
  metrics: SystemMetrics | null = null;
  logs: string[] = [];
  isLoading = true;
  error = '';
  isActionLoading = false; 
  private refreshSubscription: Subscription | null = null;

  constructor(private monitoringService: MonitoringService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadData(true);
    this.refreshSubscription = interval(3000).subscribe(() => this.loadData(false));
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) this.refreshSubscription.unsubscribe();
  }

  loadData(showLoading = true): void {
    if (showLoading) this.isLoading = true;
    
    this.monitoringService.getSystemStatus().pipe(finalize(() => {
        if (showLoading) { this.isLoading = false; this.cd.detectChanges(); }
    })).subscribe({
        next: (d) => { this.status = d; this.cd.detectChanges(); },
        error: (e) => { if (showLoading) this.error = 'Error conexión'; }
    });

    this.monitoringService.getSystemMetrics().subscribe({
        next: (d) => { this.metrics = d; this.cd.detectChanges(); }
    });

    if (this.monitoringService.getRecentLogs) {
        this.monitoringService.getRecentLogs().subscribe({
            next: (d) => { this.logs = d; this.cd.detectChanges(); }
        });
    }
  }

  get memoryUsagePercent(): number {
    if (!this.metrics) return 0;
    return Math.round((this.metrics.memory_used_mb / this.metrics.memory_total_mb) * 100);
  }

  downloadLogs(): void {
    this.downloadBlob(this.monitoringService.downloadLogFile(), 'app.log');
  }

  //  LÓGICA 1: TAREAS QUE DESCARGAN REPORTE (Limpieza, Ventas, Pedidos) 
  ejecutarTareaConDescarga(nombre: string, observable$: any, filename: string) {
    if (this.isActionLoading) return;
    if(!confirm(`¿Ejecutar tarea: ${nombre}?`)) return;

    this.isActionLoading = true;
    this.downloadBlob(observable$, filename, () => {
        this.isActionLoading = false;
        this.loadData(false); // Recargar logs para ver el resultado en la terminal
        alert(`✅ ${nombre} finalizada. Reporte descargado.`);
    });
  }

  // TAREAS SIMPLES SIN DESCARGA (Backup) 
  ejecutarTareaSimple(nombre: string, observable$: any) {
    if (this.isActionLoading) return;
    if(!confirm(`¿Iniciar ${nombre}? Esto puede tardar unos segundos.`)) return;

    this.isActionLoading = true;
    observable$
      .pipe(finalize(() => {
         this.isActionLoading = false;
         this.cd.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
           this.loadData(false);
           // Mostramos el mensaje del servidor si existe, o uno genérico
           const msg = res?.message || `✅ ${nombre} completado exitosamente.`;
           alert(msg);
        },
        error: (err: any) => {
           console.error(err);
           alert(`❌ Error al ejecutar ${nombre}. Revisa los logs.`);
        }
      });
  }

  private downloadBlob(obs$: any, defaultName: string, callback?: () => void) {
    obs$.subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        if (callback) callback();
      },
      error: (err: any) => {
        console.error('Error descarga:', err);
        if (callback) callback();
        alert('❌ Error al ejecutar/descargar.');
      }
    });
  }

  //  EVENTOS DE BOTONES 

  onLimpieza() {
    this.ejecutarTareaConDescarga('Limpieza Tokens', this.monitoringService.triggerCleanup(), 'reporte_limpieza.txt');
  }

  onBackup() {
    // Usa la lógica simple: Solo ejecuta y avisa, NO descarga archivo
    this.ejecutarTareaSimple('Backup DB', this.monitoringService.triggerBackup());
  }

  onCancelarPedidos() {
    this.ejecutarTareaConDescarga('Cancelar Pedidos', this.monitoringService.triggerCancelOrders(), 'reporte_stock.txt');
  }

  onReporteVentas() {
    this.ejecutarTareaConDescarga('Reporte Ventas', this.monitoringService.triggerSalesReport(), 'reporte_ventas.txt');
  }

  public throwTestError(): void {
    throw new Error("Sentry Test Error");
  }
}
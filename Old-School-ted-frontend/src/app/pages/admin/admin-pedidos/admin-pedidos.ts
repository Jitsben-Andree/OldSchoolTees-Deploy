import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { PedidoService } from '../../../services/pedido';
import { PedidoResponse } from '../../../models/pedido';
import { AdminUpdatePedidoStatusRequest } from '../../../models/admin-update-pedido-request';
import { AdminUpdatePagoRequest } from '../../../models/admin-update-pago-request';
import { AdminUpdateEnvioRequest } from '../../../models/admin-update-envio-request';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-admin-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './admin-pedidos.html',
})
export class AdminPedidosComponent implements OnInit {
  
  private pedidoService = inject(PedidoService);

  // Signals
  public pedidos = signal<PedidoResponse[]>([]);
  public isLoading = signal(true);
  public error = signal<string | null>(null);
  public searchTerm = signal<string>(''); 
  
  public isActionLoading = false;

  // Enums
  public estadosPedido = ['PENDIENTE', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];
  public estadosPago = ['PENDIENTE', 'COMPLETADO', 'FALLIDO'];
  public estadosEnvio = ['EN_PREPARACION', 'EN_CAMINO', 'ENTREGADO', 'RETRASADO'];

  public filteredPedidos = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const allPedidos = this.pedidos();

    if (!term) return allPedidos;

    return allPedidos.filter(p => {
      const item = p as any;
      const idMatch = item.pedidoId.toString().includes(term);
      const usuarioNombre = (item.usuario?.nombre || '').toLowerCase();
      const usuarioEmail = (item.usuario?.email || '').toLowerCase();
      const estado = (item.estado || '').toLowerCase();
      const metodo = (item.metodoPago || '').toLowerCase();
      const usuarioId = (item.usuarioId || '').toString();

      return idMatch || usuarioNombre.includes(term) || usuarioEmail.includes(term) || estado.includes(term) || metodo.includes(term) || usuarioId.includes(term);
    });
  });

  ngOnInit(): void {
    this.loadPedidos();
  }

  loadPedidos(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.pedidoService.getAllPedidosAdmin().pipe(take(1)).subscribe({
      next: (data) => {
        const sortedData = data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        this.pedidos.set(sortedData);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse | Error) => {
        const message = err instanceof HttpErrorResponse ? err.error?.message || err.message : err.message;
        this.error.set('Error al cargar pedidos: ' + message);
        this.isLoading.set(false);
      }
    });
  }

  //  GENERACIÓN DE PDF 
  
  downloadPdf(summaryPedido: PedidoResponse): void {
    if (this.isActionLoading) return;
    this.isActionLoading = true;
    document.body.style.cursor = 'wait';

    this.pedidoService.getPedidoById(summaryPedido.pedidoId).pipe(take(1)).subscribe({
      next: (fullPedido) => {
        this.generateAndSavePdf(fullPedido);
        this.isActionLoading = false;
        document.body.style.cursor = 'default';
      },
      error: (err) => {
        console.error("Error al obtener detalles para PDF", err);
        alert("No se pudo generar el PDF. Intenta de nuevo.");
        this.isActionLoading = false;
        document.body.style.cursor = 'default';
      }
    });
  }

  private generateAndSavePdf(pedido: PedidoResponse): void {
    const doc = new jsPDF();
    const pAny = pedido as any;
    const pageWidth = doc.internal.pageSize.getWidth();

    //  ENCABEZADO 
    doc.setFillColor(21, 21, 40);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('OLDSCHOOL TEES', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 20123456789', 14, 26);
    doc.text('Av. La Moda 123, Lima - Perú', 14, 31);
    doc.text('contacto@oldschooltees.com', 14, 36);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BOLETA DE VENTA', pageWidth - 14, 20, { align: 'right' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`N° 001-${pedido.pedidoId.toString().padStart(6, '0')}`, pageWidth - 14, 28, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date(pedido.fecha).toLocaleDateString()}`, pageWidth - 14, 35, { align: 'right' });

    //  INFO 
    let startY = 50;
    doc.setTextColor(0, 0, 0);
    
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 14, startY);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(pAny.usuario?.nombre || 'Desconocido', 14, startY + 6);
    doc.text(pAny.usuario?.email || '', 14, startY + 11);
    doc.setTextColor(100, 100, 100);
    doc.text(`ID: ${pAny.usuarioId || 'N/A'}`, 14, startY + 16);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('ENVÍO Y PAGO', 120, startY);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    const direccion = pAny.direccionEnvio || 'No registrada';
    const dirLines = doc.splitTextToSize(`Dirección: ${direccion}`, 80); 
    doc.text(dirLines, 120, startY + 6);
    const nextY = startY + 6 + (dirLines.length * 5);
    doc.text(`Método: ${pAny.metodoPago}`, 120, nextY);
    doc.text(`Estado: ${pAny.estadoPago}`, 120, nextY + 6);

    //  TABLA 
    const tableY = Math.max(startY + 25, nextY + 15);
    const columns = [ { header: 'Producto', dataKey: 'nombre' }, { header: 'Cant.', dataKey: 'cant' }, { header: 'Precio', dataKey: 'precio' }, { header: 'Total', dataKey: 'total' } ];
    const rows = pedido.detalles.map((d: any) => ({
      nombre: d.productoNombre || d.producto?.nombre || 'Item',
      cant: d.cantidad,
      precio: `S/ ${d.precioUnitario.toFixed(2)}`,
      total: `S/ ${d.subtotal.toFixed(2)}`
    }));

    autoTable(doc, {
      startY: tableY,
      head: [columns.map(c => c.header)],
      body: rows.map(r => Object.values(r)),
      theme: 'striped',
      headStyles: { fillColor: [21, 21, 40], textColor: 255, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 30, halign: 'right' } }
    });

    //  TOTALES 
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const subtotal = pedido.total / 1.18; 
    const igv = pedido.total - subtotal; 
    const rightX = pageWidth - 14;
    const labelX = rightX - 40;

    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', labelX, finalY, { align: 'right' });
    doc.text(`S/ ${subtotal.toFixed(2)}`, rightX, finalY, { align: 'right' });
    doc.text('IGV (18%):', labelX, finalY + 6, { align: 'right' });
    doc.text(`S/ ${igv.toFixed(2)}`, rightX, finalY + 6, { align: 'right' });
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', labelX, finalY + 14, { align: 'right' });
    doc.setTextColor(21, 21, 40);
    doc.text(`S/ ${pedido.total.toFixed(2)}`, rightX, finalY + 14, { align: 'right' });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setTextColor(150); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('Gracias por su compra en OldSchool Tees.', pageWidth / 2, footerY, { align: 'center' });

    doc.save(`Boleta_${pedido.pedidoId}.pdf`);
  }

  // ACTUALIZACIONES 

  onEstadoPedidoChange(pedidoId: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.confirmarYActualizar(pedidoId, 'estado', { nuevoEstado: select.value }, select.value);
  }

  onEstadoPagoChange(pedidoId: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.confirmarYActualizar(pedidoId, 'pago', { nuevoEstadoPago: select.value }, select.value);
  }

  onEstadoEnvioChange(pedidoId: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.confirmarYActualizar(pedidoId, 'envio', { nuevoEstadoEnvio: select.value }, select.value);
  }

  // MÉTODO PARA ELIMINAR PEDIDO
  onDeletePedido(pedidoId: number): void {
    if(!confirm(` ATENCIÓN:\n¿Estás seguro de ELIMINAR permanentemente el pedido #${pedidoId}?\n\nEsta acción borrará el historial, pagos y envíos asociados. NO se puede deshacer.`)) {
      return;
    }

    // Usamos un flag local o el global si prefieres para evitar doble click
    this.isActionLoading = true;
    
    this.pedidoService.deletePedidoAdmin(pedidoId).pipe(take(1)).subscribe({
      next: () => {
        // Quitamos el pedido de la lista visualmente
        this.pedidos.update(current => current.filter(p => p.pedidoId !== pedidoId));
        this.isActionLoading = false;
        alert(' Pedido eliminado correctamente.');
      },
      error: (err: HttpErrorResponse | Error) => {
        const msg = err instanceof HttpErrorResponse ? err.error?.message || err.message : err.message;
        this.isActionLoading = false;
        alert(` Error al eliminar: ${msg}`);
      }
    });
  }

  private confirmarYActualizar(id: number, tipo: 'estado'|'pago'|'envio', req: any, val: string) {
    if(!confirm(`¿Confirmar cambio de ${tipo}?`)) {
        this.loadPedidos(); 
        return;
    }
    this.actualizarEstado(id, tipo, req);
  }

  private actualizarEstado(pedidoId: number, tipo: 'estado' | 'pago' | 'envio', request: any): void {
    this.error.set(null);
    let updateObservable;

    switch (tipo) {
      case 'estado': updateObservable = this.pedidoService.updatePedidoStatusAdmin(pedidoId, request); break;
      case 'pago': updateObservable = this.pedidoService.updatePagoStatusAdmin(pedidoId, request); break;
      case 'envio': updateObservable = this.pedidoService.updateEnvioStatusAdmin(pedidoId, request); break;
    }

    if (!updateObservable) return;

    updateObservable.pipe(take(1)).subscribe({
      next: (pedidoActualizado) => {
        this.pedidos.update(current => 
           current.map(p => p.pedidoId === pedidoId ? pedidoActualizado : p)
        );
        alert('✅ Actualización exitosa');
      },
      error: (err: HttpErrorResponse | Error) => {
        const msg = err instanceof HttpErrorResponse ? err.error?.message || err.message : err.message;
        this.error.set(`Error al actualizar: ${msg}`);
        this.loadPedidos(); 
        alert(` Error: ${msg}`);
      }
    });
  }

  trackById(index: number, item: PedidoResponse): number {
    return item.pedidoId;
  }
}
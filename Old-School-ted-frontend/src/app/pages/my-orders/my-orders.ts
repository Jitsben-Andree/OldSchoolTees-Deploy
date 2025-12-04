import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { PedidoService } from '../../services/pedido';
import { PedidoResponse } from '../../models/pedido';
import { HttpErrorResponse } from '@angular/common/http';
// Importar librerías PDF (Cliente también quiere su recibo)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe], // RouterLink si lo usas
  templateUrl: './my-orders.html',
})
export class MyOrdersComponent implements OnInit {

  private pedidoService = inject(PedidoService);

  // Signals
  public pedidos = signal<PedidoResponse[]>([]);
  public isLoading = signal(true);
  public error = signal<string | null>(null);
  public searchTerm = signal<string>('');
  
  // Modal
  public selectedPedido = signal<PedidoResponse | null>(null);

  // Filtrado (Buscador)
  public filteredPedidos = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const all = this.pedidos();
    
    if (!term) return all;

    return all.filter(p => 
      p.pedidoId.toString().includes(term) ||
      p.estado.toLowerCase().includes(term) ||
      p.total.toString().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadPedidos();
  }

  loadPedidos() {
    this.isLoading.set(true);
    this.pedidoService.getMisPedidos().subscribe({
      next: (data) => {
        // Ordenar: Más recientes primero
        const sorted = data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        this.pedidos.set(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudieron cargar tus pedidos.');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  // --- MODAL DETALLES ---
  openDetails(pedido: PedidoResponse) {
    this.selectedPedido.set(pedido);
    document.body.style.overflow = 'hidden';
  }

  closeDetails() {
    this.selectedPedido.set(null);
    document.body.style.overflow = 'auto';
  }

  // --- LÓGICA VISUAL (Steppers & Badges) ---

  getStatusColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAGADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ENVIADO': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ENTREGADO': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  // Determina qué paso del envío está activo (1: Preparando, 2: En Camino, 3: Entregado)
  getShippingStep(estadoEnvio: string): number {
    switch (estadoEnvio) {
      case 'EN_PREPARACION': return 1;
      case 'EN_CAMINO': return 2;
      case 'ENTREGADO': return 3;
      case 'RETRASADO': return 2; // Asumimos que sigue en camino
      default: return 0; // Pendiente o sin envio
    }
  }

  // --- GENERAR PDF (Misma lógica que Admin pero adaptada a cliente) ---
  downloadReceipt(pedido: PedidoResponse) {
    const doc = new jsPDF();
    const pAny = pedido as any; // Acceso seguro
    
    // Header
    doc.setFillColor(21, 21, 40); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22); doc.setFont('helvetica', 'bold');
    doc.text('OLDSCHOOL TEES', 14, 20);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Comprobante de Compra', 14, 28);

    doc.text(`PEDIDO #${pedido.pedidoId}`, 195, 20, { align: 'right' });
    doc.text(`${new Date(pedido.fecha).toLocaleDateString()}`, 195, 28, { align: 'right' });

    // Datos
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('ENVIADO A:', 14, 55);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    const direccion = pAny.direccionEnvio || 'Dirección no registrada';
    doc.text(direccion, 14, 62);
    
    // Tabla
    const columns = [ { header: 'Producto', dataKey: 'nombre' }, { header: 'Cant.', dataKey: 'cant' }, { header: 'Precio', dataKey: 'precio' }, { header: 'Total', dataKey: 'total' } ];
    const rows = pedido.detalles.map((d: any) => ({
      nombre: d.productoNombre || d.producto?.nombre || 'Item',
      cant: d.cantidad,
      precio: `S/ ${d.precioUnitario.toFixed(2)}`,
      total: `S/ ${d.subtotal.toFixed(2)}`
    }));

    autoTable(doc, {
      startY: 80,
      head: [columns.map(c => c.header)],
      body: rows.map(r => Object.values(r)),
      theme: 'striped',
      headStyles: { fillColor: [21, 21, 40] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: S/ ${pedido.total.toFixed(2)}`, 195, finalY, { align: 'right' });

    doc.save(`Recibo_OldSchool_${pedido.pedidoId}.pdf`);
  }
}
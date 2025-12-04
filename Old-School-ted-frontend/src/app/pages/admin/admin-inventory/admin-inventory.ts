import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../../services/inventario';
import { Inventario } from '../../../models/inventario';
import { InventarioUpdateRequest } from '../../../models/inventario-update-request';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-inventory.html',
})
export class AdminInventoryComponent implements OnInit {

  private inventarioService = inject(InventarioService);

  // Signals para el estado reactivo
  public inventarioList = signal<Inventario[]>([]);
  public inventarioEdit: { [key: number]: number } = {}; 
  public status = signal<'loading' | 'success' | 'error'>('loading');
  public error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadInventario();
  }

  loadInventario(): void {
    this.status.set('loading');
    this.error.set(null);
    
    this.inventarioService.getTodoElInventario().subscribe({
      next: (data) => {
        this.inventarioList.set(data);
        this.inventarioEdit = data.reduce((acc, item) => {
          acc[item.inventarioId] = item.stock;
          return acc;
        }, {} as { [key: number]: number });
        
        this.status.set('success');
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error al cargar el inventario.');
        this.status.set('error');
      }
    });
  }

  onUpdateStock(item: Inventario): void {
    const nuevoStock = this.inventarioEdit[item.inventarioId];

    if (nuevoStock === null || nuevoStock === undefined || nuevoStock < 0) {
      alert('Por favor, ingrese un valor de stock válido (mayor o igual a 0).');
      this.inventarioEdit[item.inventarioId] = item.stock; 
      return;
    }

    if (nuevoStock === item.stock) return;

    this.status.set('loading');
    this.error.set(null);

    const request: InventarioUpdateRequest = {
      productoId: item.productoId,
      nuevoStock: nuevoStock
    };

    this.inventarioService.actualizarStock(request).subscribe({
      next: (updatedInventory) => {
        this.inventarioList.update(list =>
          list.map(inv =>
            inv.inventarioId === updatedInventory.inventarioId ? updatedInventory : inv
          )
        );
        this.inventarioEdit[updatedInventory.inventarioId] = updatedInventory.stock;
        this.status.set('success');
        
      
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || `Error al actualizar stock.`);
        this.inventarioEdit[item.inventarioId] = item.stock;
        this.status.set('success'); 
        alert(`Error: ${this.error()}`);
      }
    });
  }
}
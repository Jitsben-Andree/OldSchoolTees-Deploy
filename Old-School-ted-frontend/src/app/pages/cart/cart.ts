import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { take } from 'rxjs/operators';
import { DetalleCarrito } from '../../models/carrito'; 
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './cart.html',
  // styleUrls: ['./cart.css'] 
})
export class CartComponent implements OnInit {

  // Servicios
  public cartService = inject(CartService);
  public authService = inject(AuthService);
  private router = inject(Router);

  // Signals de Estado
  public isLoading = signal(true);
  public error = signal<string | null>(null);
  
  // Control de carga individual por ítem (para no bloquear todo el carrito al editar uno)
  public updatingQuantity = signal<number | null>(null);
  
  // Feedback visual
  public toastMessage = signal<{text: string, type: 'success' | 'error'} | null>(null);

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart() {
    if (!this.cartService.cart()) {
        this.isLoading.set(true);
    }
    
    this.cartService.getMiCarrito().pipe(take(1)).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.error.set('No se pudo cargar tu carrito. Intenta recargar la página.');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  onRemoveItem(detalleId: number, productName: string) {
    if (!confirm(`¿Eliminar "${productName}" de la cesta?`)) return;
    
    // Bloqueamos visualmente este ítem mientras se borra
    this.updatingQuantity.set(detalleId);

    this.cartService.removeItem(detalleId).pipe(take(1)).subscribe({
      next: () => {
        this.showToast('Producto eliminado correctamente', 'success');
        this.updatingQuantity.set(null);
      },
      error: (err: Error) => {
        this.showToast('Error al eliminar producto', 'error');
        this.updatingQuantity.set(null);
      }
    });
  }

  increaseQuantity(item: DetalleCarrito): void {
   
    this.updateQuantity(item, item.cantidad + 1);
  }

  decreaseQuantity(item: DetalleCarrito): void {
      if (item.cantidad > 1) {
          this.updateQuantity(item, item.cantidad - 1);
      } else {
          this.onRemoveItem(item.detalleCarritoId, item.productoNombre);
      }
  }

  private updateQuantity(item: DetalleCarrito, nuevaCantidad: number): void {
      this.updatingQuantity.set(item.detalleCarritoId); 

      this.cartService.updateItemQuantity(item.detalleCarritoId, nuevaCantidad)
          .pipe(take(1))
          .subscribe({
              next: () => {
                  // Feedback sutil, no intrusivo
                  this.updatingQuantity.set(null); 
              },
              error: (err: Error) => {
                  this.showToast('No se pudo actualizar la cantidad', 'error');
                  this.updatingQuantity.set(null);
              }
          });
  }

  onCheckout() {
    if (!this.cartService.cart() || this.cartService.cart()!.items.length === 0) {
      this.showToast('Tu carrito está vacío', 'error');
      return;
    }
    this.router.navigate(['/checkout']);
  }

  // Helpers
  trackById(index: number, item: DetalleCarrito): number {
    return item.detalleCarritoId;
  }

  private showToast(text: string, type: 'success' | 'error'): void {
    this.toastMessage.set({ text, type });
    // Auto-ocultar después de 3 segundos
    setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
// home.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs';

import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { ProductoResponse } from '../../models/producto';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  public  authService  = inject(AuthService);
  private router        = inject(Router);

  public products = signal<ProductoResponse[]>([]);
  public isLoading = signal(true);
  public error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.productService.getAllProductosActivos().pipe(take(1)).subscribe({
      next: (data) => {
        this.products.set(data ?? []);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse | Error) => {
        const message = err instanceof HttpErrorResponse ? (err.error?.message || err.message) : err.message;
        this.error.set('Error al cargar productos: ' + message);
        this.isLoading.set(false);
        console.error('Error en getAllProductosActivos:', err);
      }
    });
  }

  onAddToCart(productId: number, productName: string): void {
    if (!this.authService.isLoggedIn()) {
      alert('Debes iniciar sesión para añadir productos al carrito.');
      this.router.navigate(['/login']);
      return;
    }

    const cantidad = 1;
    this.error.set(null);

    this.cartService.addItem(productId, cantidad).pipe(take(1)).subscribe({
      next: () => {
        alert(`¡"${productName}" añadido al carrito!`);
      },
      error: (err: HttpErrorResponse | Error) => {
        const backendErrorMessage = err instanceof HttpErrorResponse ? (err.error?.message || err.message) : err.message;
        alert(`Error al añadir "${productName}": ${backendErrorMessage || 'Ocurrió un error inesperado.'}`);
      }
    });
  }
}

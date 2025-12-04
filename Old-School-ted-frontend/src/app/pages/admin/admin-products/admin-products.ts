import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router'; 
import { ProductService } from '../../../services/product';
import { ProductoResponse } from '../../../models/producto'; 
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';
import { saveAs } from 'file-saver'; 

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './admin-products.html',
})
export class AdminProductsComponent implements OnInit {

  private productService = inject(ProductService);

  public products = signal<ProductoResponse[]>([]);
  public isLoading = signal(true);
  public error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.productService.getAllProductosAdmin().pipe(take(1)).subscribe({
      next: (data) => {
        this.products.set(data);
        this.isLoading.set(false);
      },
      error: (err: Error) => { 
        this.error.set('Error al cargar productos: ' + err.message);
        this.isLoading.set(false);
        console.error("Error en getAllProductosIncludingInactive:", err);
      }
    });
  }

  onDeactivate(id: number, nombre: string): void {
    if (!confirm(`¿Desactivar producto "${nombre}"? No se mostrará en la tienda.`)) {
      return;
    }
    this.error.set(null);
    
    this.productService.deleteProducto(id).pipe(take(1)).subscribe({
        next: () => {
             this.products.update(currentProds =>
                 currentProds.map(p => p.id === id ? { ...p, activo: false } : p)
             );
        },
        error: (err: Error) => { 
            this.error.set(`Error al desactivar: ${err.message}`);
        }
    });
  }

   onActivate(id: number, nombre: string): void {
      if (!confirm(`¿Reactivar producto "${nombre}"? Volverá a ser visible.`)) {
        return;
      }
      this.error.set(null);
      
       const productoActual = this.products().find(p => p.id === id);
       if (!productoActual) return;

      
       const request = {
           nombre: productoActual.nombre,
           descripcion: productoActual.descripcion,
           precio: productoActual.precioOriginal || productoActual.precio,
           talla: productoActual.talla,
           categoriaId: 1, 
           activo: true
       };

       this.isLoading.set(true); 
       this.productService.updateProducto(id, request as any).pipe(take(1)).subscribe({
            next: (updatedProduct) => {
               this.products.update(currentProds =>
                    currentProds.map(p => p.id === id ? updatedProduct : p)
               );
               this.isLoading.set(false);
            },
            error: (err: Error) => {
               this.error.set(`Error al reactivar: ${err.message}`);
               this.isLoading.set(false);
           }
       });
   }

  exportToExcel(): void {
      this.isLoading.set(true); 
      this.error.set(null);

      this.productService.exportProductosToExcel().subscribe({
          next: (blob) => {
              const filename = `oldschool_inventario_${new Date().toISOString().split('T')[0]}.xlsx`;
              saveAs(blob, filename); 
              this.isLoading.set(false);
          },
          error: (err: Error) => { 
              this.error.set('Error al exportar: ' + err.message);
              this.isLoading.set(false);
          }
      });
  }

  trackById(index: number, item: ProductoResponse): number {
    return item.id;
  }
}
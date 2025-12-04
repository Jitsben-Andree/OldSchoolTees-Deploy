import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { ProductoResponse } from '../../models/producto';
import { Categoria } from '../../models/categoria';
import { take } from 'rxjs';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './catalogo.html',
})
export class CatalogoComponent implements OnInit {

  private productService = inject(ProductService);
  private cartService = inject(CartService);
  public authService = inject(AuthService);
  private router = inject(Router);

  //  DATOS 
  public allProducts = signal<ProductoResponse[]>([]);
  public categories = signal<Categoria[]>([]);
  
  //  ESTADO DE CARGA 
  public isLoading = signal(true);
  public error = signal<string | null>(null);

  //  FILTROS 
  public searchTerm = signal('');
  public selectedCategory = signal<string>('all');
  public selectedSize = signal<string>('all');
  public priceRange = signal<number>(1000);

  //  FILTRADO REACTIVO (COMPUTED) 
  public filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const cat = this.selectedCategory();
    const size = this.selectedSize();
    const maxPrice = this.priceRange();

    return this.allProducts().filter(prod => {
      // Filtro por Nombre
      const matchesName = prod.nombre.toLowerCase().includes(term) || 
                          (prod.descripcion && prod.descripcion.toLowerCase().includes(term));

      const matchesCategory = cat === 'all' || prod.categoriaNombre === this.getCategoryNameById(cat);
      
      // Filtro por Talla
      const matchesSize = size === 'all' || prod.talla === size;

      // Filtro por Precio
      const matchesPrice = prod.precio <= maxPrice;

      return matchesName && matchesCategory && matchesSize && matchesPrice;
    });
  });

  // Helper para obtener nombre de categoría 
  private getCategoryNameById(id: string): string {
      const category = this.categories().find(c => c.idCategoria.toString() === id);
      return category ? category.nombre : '';
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    // Cargar Categorías
    this.productService.getAllCategorias().pipe(take(1)).subscribe({
        next: (cats) => this.categories.set(cats),
        error: (err) => console.error('Error cargando categorías', err)
    });

    // Cargar Productos
    this.productService.getAllProductosActivos().pipe(take(1)).subscribe({
      next: (data) => {
        this.allProducts.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudo cargar el catálogo.');
        this.isLoading.set(false);
      }
    });
  }

  //  ACCIONES 
  onAddToCart(productId: number, productName: string): void {
    if (!this.authService.isLoggedIn()) {
      if(confirm('Inicia sesión para comprar. ¿Ir al login?')) {
         this.router.navigate(['/login']);
      }
      return;
    }
    this.cartService.addItem(productId, 1).pipe(take(1)).subscribe({
      next: () => alert(`¡"${productName}" añadido!`),
      error: () => alert('Error al añadir.')
    });
  }

  resetFilters(): void {
      this.searchTerm.set('');
      this.selectedCategory.set('all');
      this.selectedSize.set('all');
      this.priceRange.set(1000);
  }
}
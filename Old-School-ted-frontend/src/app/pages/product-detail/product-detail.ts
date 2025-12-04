import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { ProductoResponse } from '../../models/producto';
import { HttpErrorResponse } from '@angular/common/http';
import { take, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule,  CurrencyPipe, FormsModule],
  templateUrl: './product-detail.html',
})
export class ProductDetailComponent implements OnInit {
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  public authService = inject(AuthService);

  public product = signal<ProductoResponse | null>(null);
  public isLoading = signal(true);
  public error = signal<string | null>(null);
  
  public activeImageIndex = signal(0);

  public quantityToAdd = signal(1);
  public showSizeChart = signal(false);
  public isWishlisted = signal(false);
  public toastMessage = signal<{text: string, type: 'success' | 'error'} | null>(null);

  public activeAccordion = signal<string | null>('description'); 

  public personalizationMode = signal<'player' | 'custom' | null>(null); 
  public selectedPlayer: string = ''; 
  public customName: string = '';
  public customNumber: string = '';
  
  public selectedPatch = signal<string | null>(null); 

  public totalPrice = computed(() => {
    const prod = this.product();
    if (!prod) return 0;
    
    let total = prod.precio;
    
    if (this.personalizationMode() !== null) {
      total += 97.00;
    }

    if (this.selectedPatch() !== null) {
      total += 73.00;
    }

    return total;
  });

  ngOnInit(): void {
    this.loadProductDetails();
  }

  loadProductDetails(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.route.paramMap.pipe(
      take(1),
      switchMap(params => {
        const idParam = params.get('id');
        if (!idParam) throw new Error('No se encontró ID de producto.');
        const productId = +idParam;
        return this.productService.getProductoById(productId);
      })
    ).subscribe({
      next: (data) => {
        this.product.set(data);
        this.isLoading.set(false);
        this.quantityToAdd.set(1);
        this.activeImageIndex.set(0);
        
        this.personalizationMode.set(null);
        this.selectedPlayer = '';
        this.customName = '';
        this.customNumber = '';
      },
      error: (err: Error | HttpErrorResponse) => {
        const message = err instanceof HttpErrorResponse ? err.error?.message || err.message : err.message;
        this.error.set(message);
        this.isLoading.set(false);
      }
    });
  }

  setActiveImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  toggleAccordion(sectionId: string): void {
    this.activeAccordion.update(current => current === sectionId ? null : sectionId);
  }

  setPersonalizationMode(mode: 'player' | 'custom'): void {
    this.personalizationMode.update(current => current === mode ? null : mode);
    
    if (this.personalizationMode() === null) {
       this.selectedPlayer = '';
       this.customName = '';
       this.customNumber = '';
    }
  }

  togglePatch(patch: string): void {
    this.selectedPatch.update(current => current === patch ? null : patch);
  }

  onAddToCart(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    if (!this.authService.isLoggedIn()) {
      this.showToast('Debes iniciar sesión para comprar', 'error');
      setTimeout(() => this.router.navigate(['/login']), 1500);
      return;
    }

    if (currentProduct.stock <= 0) {
      this.showToast('Producto agotado', 'error');
      return;
    }

    let personalizacionData: { tipo: string, numero: string, nombre: string, precio: number } | null = null;

    if (this.personalizationMode() === 'player' && this.selectedPlayer) {
      const parts = this.selectedPlayer.split('-');
      if (parts.length >= 2) {
        personalizacionData = {
          tipo: 'Leyenda',
          numero: parts[0].trim(),
          nombre: parts[1].trim(),
          precio: 97.00
        };
      }
    } 
    else if (this.personalizationMode() === 'custom') {
      if (this.customName || this.customNumber) {
        personalizacionData = {
          tipo: 'Custom',
          numero: this.customNumber,
          nombre: this.customName.toUpperCase(),
          precio: 97.00
        };
      }
    }

    const parcheSeleccionado = this.selectedPatch() ? { tipo: this.selectedPatch()!, precio: 73.00 } : null;

    this.cartService.addItem(currentProduct.id, this.quantityToAdd(), personalizacionData, parcheSeleccionado)
      .pipe(take(1))
      .subscribe({
        next: () => {
          let msg = `¡${currentProduct.nombre} añadido!`;
          if (personalizacionData) msg += ' (Personalizado)';
          this.showToast(msg, 'success');
          
          setTimeout(() => {
            this.router.navigate(['/cart']);
          }, 800);
        },
        error: (err) => {
          this.showToast('Error al añadir al carrito', 'error');
          console.error(err);
        }
      });
  }

  toggleWishlist(): void {
    this.isWishlisted.update(v => !v);
    this.showToast(this.isWishlisted() ? 'Añadido a favoritos' : 'Eliminado de favoritos', 'success');
  }

  toggleSizeChart(): void {
    this.showSizeChart.update(v => !v);
  }

  goBack(): void {
    this.location.back();
  }

  private showToast(text: string, type: 'success' | 'error'): void {
    this.toastMessage.set({ text, type });
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  increaseQuantity() { this.quantityToAdd.update(q => q + 1); }
  decreaseQuantity() { if(this.quantityToAdd() > 1) this.quantityToAdd.update(q => q - 1); }
}
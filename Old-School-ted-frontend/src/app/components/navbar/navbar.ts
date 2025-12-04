import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  
  public authService = inject(AuthService);
  public cartService = inject(CartService);
  private router = inject(Router);

  // Computar items del carrito
  public totalCartItems = computed(() => {
    const cart = this.cartService.cart();
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.cantidad, 0);
  });

  // Estado del menú móvil
  public isMobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(isOpen => !isOpen);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  logout(): void {
    // Usamos confirm nativo o podrías usar un modal más bonito
    if (confirm('¿Cerrar sesión?')) {
      this.authService.logout();
      this.cartService.clearCartOnLogout();
      this.router.navigate(['/login']);
      this.closeMobileMenu();
    }
  }
}
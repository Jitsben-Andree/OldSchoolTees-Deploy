import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { NavbarComponent } from './navbar';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';

class AuthServiceMock {
  isLoggedIn() { return false; }
  logout = jasmine.createSpy('logout');
}

class CartServiceMock {
  cart: any;

  constructor() {
    const fn: any = jasmine.createSpy('cart').and.returnValue([]);
    fn.set = jasmine.createSpy('set');                            
    this.cart = fn;
  }

  getMiCarrito() {
    return of(null);
  }

  clearCartOnLogout = jasmine.createSpy('clearCartOnLogout');
}

describe('Navbar', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NavbarComponent,
        RouterTestingModule.withRoutes([
          { path: 'login', component: class DummyComponent {} }
        ])
      ],
      providers: [
        { provide: AuthService, useClass: AuthServiceMock },
        { provide: CartService, useClass: CartServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should logout, limpiar carrito y navegar a /login', () => {
    const auth = TestBed.inject(AuthService) as unknown as AuthServiceMock;
    const cart = TestBed.inject(CartService) as unknown as CartServiceMock;

    spyOn(window, 'confirm').and.returnValue(true); 
    const navSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component.logout();

    expect(auth.logout).toHaveBeenCalled();
    expect(cart.clearCartOnLogout).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['/login']);
  });
});

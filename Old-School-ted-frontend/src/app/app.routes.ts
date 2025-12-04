import { Routes } from '@angular/router';

// Guards
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';

//  COMPONENTES PÚBLICOS 
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';

//  COMPONENTES DE CLIENTE (Protegidos) 
import { CartComponent } from './pages/cart/cart';
import { CheckoutComponent } from './pages/checkout/checkout';
import { MyOrdersComponent } from './pages/my-orders/my-orders';

//  COMPONENTES DE ADMIN (Protegidos) 
import { AdminLayoutComponent } from './pages/admin/admin-layout/admin-layout';
import { AdminProductsComponent } from './pages/admin/admin-products/admin-products';
import { AdminProductFormComponent } from './pages/admin/admin-product-form/admin-product-form';
import { AdminInventoryComponent } from './pages/admin/admin-inventory/admin-inventory';
import { AdminPedidosComponent } from './pages/admin/admin-pedidos/admin-pedidos';
import { AdminCategoriasComponent } from './pages/admin/admin-categorias/admin-categorias';
import { AdminProveedoresComponent } from './pages/admin/admin-proveedores/admin-proveedores';
import { AdminPromocionesComponent } from './pages/admin/admin-promociones/admin-promociones';
import { AdminAsignacionesComponent } from './pages/admin/admin-asignaciones/admin-asignaciones';
import { ProductDetailComponent } from './pages/product-detail/product-detail';
import { UnlockAccountComponent } from './pages/unlock/unlock';
import { CatalogoComponent } from './pages/catalogo/catalogo';
import { AdminLogsComponent } from './pages/admin/admin-logs/admin-logs';

export const routes: Routes = [
  // Rutas Públicas
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'producto/:id', component: ProductDetailComponent }, 
  { path: 'unlock', component: UnlockAccountComponent },

  // Rutas Protegidas Cliente o Admin
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'mis-pedidos', component: MyOrdersComponent, canActivate: [authGuard] },
  { path: 'catalogo', component: CatalogoComponent },

  // Rutas de Administrador
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard], 
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' }, 
      { path: 'products', component: AdminProductsComponent },
      { path: 'products/new', component: AdminProductFormComponent },
      { path: 'products/edit/:id', component: AdminProductFormComponent },
      { path: 'inventory', component: AdminInventoryComponent },
      { path: 'pedidos', component: AdminPedidosComponent },
      { path: 'categorias', component: AdminCategoriasComponent },
      { path: 'proveedores', component: AdminProveedoresComponent },
      { path: 'promociones', component: AdminPromocionesComponent },
      { path: 'asignaciones', component: AdminAsignacionesComponent },
      { path: 'logs', component: AdminLogsComponent },
    ]
  },

  
  { path: '**', redirectTo: '' } 
];


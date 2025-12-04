import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';


export const authGuard: CanActivateFn = (route, state) => {
  
  // Inyectamos los servicios necesarios
  const authService = inject(AuthService);
  const router = inject(Router);

  // Usamos el signal computado de nuestro servicio
  if (authService.isLoggedIn()) {
    return true; // El usuario está logueado, puede pasar
  } else {
    // El usuario NO está logueado, lo redirigimos al login
    console.warn('Acceso denegado: Usuario no autenticado. Redirigiendo a /login');
    router.navigate(['/login']);
    return false;
  }
};
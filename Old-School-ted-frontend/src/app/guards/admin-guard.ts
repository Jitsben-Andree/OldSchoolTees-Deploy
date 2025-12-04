import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { map } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
  
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificamos si el usuario es Admin usando el signal
  const isAdmin = authService.isAdmin();

  if (isAdmin) {
    //  Si es admin, permitir acceso
    return true;
  } else {
    // Si no es admin, redirigir al Home
    console.warn('Acceso denegado: Se requiere rol de Administrador.');
    router.navigate(['/']); 
    return false;
  }
};

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Promocion, PromocionRequest } from '../models/promocion';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PromocionService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  // Separar URLs públicas y de admin
  private API_URL_PUBLIC = `${environment.apiUrl}/promociones`;
  private API_URL_ADMIN = `${environment.apiUrl}/admin/promociones`; 

  //  Helper para cabeceras 
  private createAuthHeaders(): HttpHeaders {
     const token = this.authService.jwtToken();
     if (!token) {
         console.error("Token no encontrado para PromocionService");
         return new HttpHeaders();
     }
     return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  //  Métodos Públicos 
  getAllPromociones(): Observable<Promocion[]> {
    // Usar URL pública
    return this.http.get<Promocion[]>(this.API_URL_PUBLIC).pipe(
      catchError(this.handleError) 
    );
  }

  getPromocionById(id: number): Observable<Promocion> {
    // Usar URL pública
    return this.http.get<Promocion>(`${this.API_URL_PUBLIC}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // --- Métodos de Administrador ---
  crearPromocion(request: PromocionRequest): Observable<Promocion> {
    // Usar URL de admin
    return this.http.post<Promocion>(this.API_URL_ADMIN, request, { headers: this.createAuthHeaders() }).pipe(
      catchError(this.handleAdminError) // Usar manejo de error de admin
    );
  }

  actualizarPromocion(id: number, request: PromocionRequest): Observable<Promocion> {
    // Usar URL de admin
    return this.http.put<Promocion>(`${this.API_URL_ADMIN}/${id}`, request, { headers: this.createAuthHeaders() }).pipe(
      catchError(this.handleAdminError)
    );
  }

  desactivarPromocion(id: number): Observable<void> {
    // Usar URL de admin
    return this.http.delete<void>(`${this.API_URL_ADMIN}/${id}`, { headers: this.createAuthHeaders() }).pipe(
      catchError(this.handleAdminError)
    );
  }


  // --- Manejadores de Errores ---
   private handleError(error: HttpErrorResponse): Observable<never> {
    console.error("PromocionService Error (Público):", error.message);
    let userMessage = 'Ocurrió un error al procesar la solicitud de promociones.';
    if (error.status === 404) userMessage = 'Promoción no encontrada.';
    else if (error.status === 0) userMessage = 'No se pudo conectar con el servidor.';
    return throwError(() => new Error(userMessage));
  }

  private handleAdminError(error: HttpErrorResponse): Observable<never> {
    console.error("PromocionService Error (Admin):", error);
    let message = error.error?.message || error.message || 'Ocurrió un error en la operación de promoción.';
    if (error.status === 403) message = 'No tienes permiso para realizar esta acción.';
    else if (error.status === 401) message = 'Tu sesión ha expirado. Inicia sesión de nuevo.';
    else if (error.status === 404) message = 'La promoción no fue encontrada.';
    else if (error.status === 409) message = 'Ya existe una promoción con ese código.'; // Manejar CONFLICT
    else if (error.status === 400) message = `Error en la solicitud: ${message}`;
    return throwError(() => new Error(message));
  }
}


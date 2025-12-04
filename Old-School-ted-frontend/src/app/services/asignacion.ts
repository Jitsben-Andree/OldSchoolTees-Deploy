import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AsignacionResponse, AsignacionRequest, UpdatePrecioRequest } from '../models/asignacion';
import { AuthService } from './auth'; 
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AsignacionService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private API_URL = `${environment.apiUrl}/asignaciones`; 

  // Helper para crear cabeceras 
  private createAuthHeaders(): HttpHeaders {
     const token = this.authService.jwtToken();
     if (!token) {
         console.error("Token no encontrado para AsignacionService");
         return new HttpHeaders();
     }
     return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }


  createAsignacion(request: AsignacionRequest): Observable<AsignacionResponse> {
    return this.http.post<AsignacionResponse>(this.API_URL, request, { headers: this.createAuthHeaders() }).pipe(
      catchError(this.handleAdminError)
    );
  }

  getAsignacionesPorProducto(productoId: number): Observable<AsignacionResponse[]> {
    return this.http.get<AsignacionResponse[]>(`${this.API_URL}/producto/${productoId}`, { headers: this.createAuthHeaders() }).pipe(
      catchError(this.handleAdminError)
    );
  }

  getAsignacionesPorProveedor(proveedorId: number): Observable<AsignacionResponse[]> {
    return this.http.get<AsignacionResponse[]>(`${this.API_URL}/proveedor/${proveedorId}`, { headers: this.createAuthHeaders() }).pipe(
      catchError(this.handleAdminError)
    );
  }

  updatePrecioCosto(asignacionId: number, request: UpdatePrecioRequest): Observable<AsignacionResponse> {
    // Usa PUT y la URL ProductoProveedorController
    return this.http.put<AsignacionResponse>(`${this.API_URL}/${asignacionId}/precio`, request, { headers: this.createAuthHeaders() }).pipe(
      catchError(this.handleAdminError)
    );
  }


  deleteAsignacion(asignacionId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${asignacionId}`, { headers: this.createAuthHeaders() }).pipe(
      catchError(this.handleAdminError)
    );
  }


  //  Manejador de Errores Específico para Admin 
  private handleAdminError(error: HttpErrorResponse): Observable<never> {
    console.error("AsignacionService Error (Admin):", error);
    
    const errorBody = error.error;
    let message = 'Ocurrió un error en la operación de asignación.'; 

    if (errorBody && typeof errorBody === 'string') {
        message = errorBody;
    } else if (errorBody && errorBody.message) {
        message = errorBody.message;
    } else if (error.message) {
         message = error.message;
    }


     if (error.status === 403) {
      message = 'No tienes permiso para realizar esta acción.';
     } else if (error.status === 401) {
       message = 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
     } else if (error.status === 404) {
        message = 'El recurso solicitado (asignación, producto o proveedor) no fue encontrado.';
     } else if (error.status === 400) {
         message = `Error en la solicitud: ${message}`;
     }
    return throwError(() => new Error(message));
  }

}


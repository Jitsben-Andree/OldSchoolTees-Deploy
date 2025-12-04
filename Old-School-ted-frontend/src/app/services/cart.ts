import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Carrito } from '../models/carrito';
import { AddItemRequest } from '../models/add-item-request'; 
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private API_URL = `${environment.apiUrl}/carrito`;

  public cart = signal<Carrito | null>(null);

  private createAuthHeaders(): HttpHeaders {
    const token = this.authService.jwtToken();
    if (!token) {
      console.error("Token no encontrado para CartService");
      return new HttpHeaders();
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getMiCarrito(): Observable<Carrito> {
    return this.http.get<Carrito>(`${this.API_URL}/mi-carrito`, {
      headers: this.createAuthHeaders()
    }).pipe(
      tap(carrito => this.cart.set(carrito)),
      catchError(this.handleError)
    );
  }

  addItem(
    productoId: number, 
    cantidad: number, 
    personalizacion?: any, 
    parche?: any           
  ): Observable<Carrito> {
    
    console.log(`CartService: Añadiendo item ${productoId}`, { personalizacion, parche });
    
    //  objeto request con los nuevos campos
    const request: AddItemRequest = { 
        productoId, 
        cantidad,
        personalizacion, 
        parche 
    };

    return this.http.post<Carrito>(`${this.API_URL}/agregar`, request, {
      headers: this.createAuthHeaders()
    }).pipe(
      tap(carrito => {
        console.log("CartService: Carrito actualizado", carrito);
        this.cart.set(carrito);
      }),
      catchError(this.handleError)
    );
  }

  removeItem(detalleCarritoId: number): Observable<Carrito> {
    return this.http.delete<Carrito>(`${this.API_URL}/eliminar/${detalleCarritoId}`, {
      headers: this.createAuthHeaders()
    }).pipe(
      tap(carrito => this.cart.set(carrito)),
      catchError(this.handleError)
    );
  }

  updateItemQuantity(detalleCarritoId: number, nuevaCantidad: number): Observable<Carrito> {
    if (nuevaCantidad < 1) return throwError(() => new Error("La cantidad no puede ser menor que 1."));
    
    return this.http.put<Carrito>(`${this.API_URL}/actualizar-cantidad/${detalleCarritoId}`, { nuevaCantidad }, {
      headers: this.createAuthHeaders()
    }).pipe(
      tap(carrito => this.cart.set(carrito)),
      catchError(this.handleError)
    );
  }

  clearCartOnLogout(): void {
    this.cart.set(null);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error("CartService Error:", error);
    let userMessage = 'Ocurrió un error al procesar el carrito.';
    if (error.status === 401) userMessage = 'Sesión expirada. Inicia sesión de nuevo.';
    return throwError(() => new Error(userMessage));
  }
}
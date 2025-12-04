import { PedidoRequest } from './../models/pedido-request';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PedidoResponse } from '../models/pedido';
import { AdminUpdateEnvioRequest } from '../models/admin-update-envio-request'; // Ajusta si es necesario
import { AdminUpdatePagoRequest } from '../models/admin-update-pago-request';
import { AdminUpdatePedidoStatusRequest } from '../models/admin-update-pedido-request';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pedidos`;
  private adminApiUrl = `${environment.apiUrl}/admin/pedidos`;

  constructor() { }

  crearPedidoDesdeCarrito(request: PedidoRequest): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(`${this.apiUrl}/crear`, request).pipe(catchError(this.handleError));
  }

  getMisPedidos(): Observable<PedidoResponse[]> {
    return this.http.get<PedidoResponse[]>(`${this.apiUrl}/mis-pedidos`).pipe(catchError(this.handleError));
  }

  getPedidoById(id: number): Observable<PedidoResponse> {
    return this.http.get<PedidoResponse>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  //  ADMIN 
  getAllPedidosAdmin(): Observable<PedidoResponse[]> {
    return this.http.get<PedidoResponse[]>(this.adminApiUrl).pipe(catchError(this.handleError));
  }

  updatePedidoStatusAdmin(id: number, request: AdminUpdatePedidoStatusRequest): Observable<PedidoResponse> {
    return this.http.patch<PedidoResponse>(`${this.adminApiUrl}/${id}/estado`, request).pipe(catchError(this.handleError));
  }

  updatePagoStatusAdmin(id: number, request: AdminUpdatePagoRequest): Observable<PedidoResponse> {
    return this.http.patch<PedidoResponse>(`${this.adminApiUrl}/${id}/pago`, request).pipe(catchError(this.handleError));
  }

  updateEnvioStatusAdmin(id: number, request: AdminUpdateEnvioRequest): Observable<PedidoResponse> {
    return this.http.patch<PedidoResponse>(`${this.adminApiUrl}/${id}/envio`, request).pipe(catchError(this.handleError));
  }

  // Método para Eliminar Pedido
  deletePedidoAdmin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en PedidoService:', error);
    const errorMsg = error.error?.message || error.message || 'Error desconocido.';
    return throwError(() => new Error(errorMsg));
  }
}
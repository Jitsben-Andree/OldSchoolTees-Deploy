import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Proveedor } from '../models/proveedor';
import { ProveedorRequest } from '../models/proveedor-request';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {

  private http = inject(HttpClient);
  
  private apiUrl = `${environment.apiUrl}/proveedores`;
  // Todos estos endpoints requieren token de Admin (que el interceptor ya añade)

  getAllProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

 
  createProveedor(request: ProveedorRequest): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, request).pipe(
      catchError(this.handleError)
    );
  }


  updateProveedor(id: number, request: ProveedorRequest): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, request).pipe(
      catchError(this.handleError)
    );
  }


  deleteProveedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Ocurrió un error en ProveedorService:', error);
    const errorMsg = error.error?.message || error.message || 'Error en el servicio de proveedores.';
    return throwError(() => new Error(errorMsg));
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Categoria } from '../models/categoria';
import { CategoriaRequest } from '../models/categoria-request';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categorias`; 

  //  MÉTODOS PÚBLICOS (GET) 
  getAllCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

 
  getCategoriaById(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  //  MÉTODOS DE ADMIN (Protegidos por Interceptor) 

  createCategoria(request: CategoriaRequest): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, request).pipe(
      catchError(this.handleError)
    );
  }

  updateCategoria(id: number, request: CategoriaRequest): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}/${id}`, request).pipe(
      catchError(this.handleError)
    );
  }

 
  deleteCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  //  Manejador de Errores 
  private handleError(error: any): Observable<never> {
    console.error('Ocurrió un error en CategoriaService:', error);
    return throwError(() => new Error('Error en el servicio de categorías. ' + (error.message || '')));
  }
}


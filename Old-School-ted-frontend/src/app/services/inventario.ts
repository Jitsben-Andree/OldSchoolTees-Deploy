import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inventario } from '../models/inventario';
import { InventarioUpdateRequest } from '../models/inventario-update-request';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private http = inject(HttpClient);
  
  // private authService = inject(AuthService); 
  private apiUrl = `${environment.apiUrl}/inventario`;

 
 
  getTodoElInventario(): Observable<Inventario[]> {
    return this.http.get<Inventario[]>(`${this.apiUrl}/all`);
  }


  getInventarioPorProductoId(productoId: number): Observable<Inventario> {
    return this.http.get<Inventario>(`${this.apiUrl}/producto/${productoId}`);
  }

  actualizarStock(request: InventarioUpdateRequest): Observable<Inventario> {
    return this.http.put<Inventario>(`${this.apiUrl}/stock`, request);
  }
}


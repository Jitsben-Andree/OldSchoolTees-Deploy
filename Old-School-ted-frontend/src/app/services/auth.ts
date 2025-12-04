import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { AuthResponse } from '../models/auth-response';
import { LoginRequest } from '../models/login-request';
import { RegisterRequest } from '../models/register-request';
import { UnlockRequest } from '../models/UnlockRequest';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  
  private API_URL = `${environment.apiUrl}/auth`


  //  Signals para el estado de autenticación 
  public jwtToken = signal<string | null>(localStorage.getItem('token'));
  public currentUser = signal<AuthResponse | null>(
    JSON.parse(localStorage.getItem('user') || 'null')
  );

 
  public isLoggedIn = computed(() => !!this.jwtToken());
  public isAdmin = computed(() => 
    this.currentUser()?.roles?.includes('Administrador') ?? false
  );


  public register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, request).pipe(
      tap(response => this.saveAuthData(response)),
      catchError(this.handleError)
    );
  }


  public login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, request).pipe(
      tap(response => this.saveAuthData(response)),
      catchError(this.handleError)
    );
  }


  public logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.jwtToken.set(null);
    this.currentUser.set(null);
  }


  public requestResetCode(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/request-reset`, { email }).pipe(
      catchError(this.handleError)
    );
  }

  public unlockAccount(request: UnlockRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/unlock`, request).pipe(
      catchError(this.handleError)
    );
  }

  private saveAuthData(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response));
    this.jwtToken.set(response.token);
    this.currentUser.set(response);
  }

  //  Manejador de Errores 
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Ocurrió un error en AuthService:', error.message);
    
    // backend ahora envía un objeto
    const errorMsg = error.error?.error || 
                     error.error?.message || 
                     error.message || 
                     'Error desconocido en el servicio de autenticación.';
    
    // Lanzamos el mensaje de error específico
    return throwError(() => new Error(errorMsg));
  }
}
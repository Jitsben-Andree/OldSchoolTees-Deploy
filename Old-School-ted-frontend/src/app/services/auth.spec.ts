import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth'; 

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
      ],
    }).compileComponents();

    service = TestBed.inject(AuthService);
  });

  it('debe crearse el servicio AuthService', () => {
    expect(service).toBeTruthy();
  });

  it('debe tener el método login definido', () => {
    expect(typeof (service as any).login).toBe('function');
  });

  it('debe tener el método logout definido', () => {
    expect(typeof (service as any).logout).toBe('function');
  });
});

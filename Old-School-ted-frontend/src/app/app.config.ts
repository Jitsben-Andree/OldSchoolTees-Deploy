import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { provideRouter, withInMemoryScrolling, Router } from '@angular/router'; 
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './interceptors/jwt-interceptor';
import * as Sentry from "@sentry/angular";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Tus rutas existentes
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top', 
      })
    ),

    // Tu cliente HTTP con JWT
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),

    //  CONFIGURACIÓN DE SENTRY  
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false, 
      }),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
  ],
};
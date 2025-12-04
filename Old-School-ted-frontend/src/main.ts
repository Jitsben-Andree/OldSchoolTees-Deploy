import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from "@sentry/angular";
import { appConfig } from './app/app.config';
import { App } from './app/app'; // ✅ CORREGIDO: Usar AppComponent

Sentry.init({
  dsn: "https://1c76391f03f6856bb9dfc4acd3043bf7@o4510462223646720.ingest.us.sentry.io/4510465815609344",
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],

  // CONFIGURACIÓN DE RASTREO
  tracePropagationTargets: [
    // 1. Desarrollo Local
    "localhost", 
    /^http:\/\/localhost:8080\/api\/v1/,
    
    // 2. Producción (VPS) 
    /^http:\/\/147\.79\.87\.94:8085\/api\/v1/
  ],

  tracesSampleRate: 1.0, 
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  release: "oldschool-frontend@1.0.0", 
  environment: "production",           
  
  sendDefaultPii: true 
});

// ✅ CORREGIDO: bootstrapApplication usa AppComponent
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
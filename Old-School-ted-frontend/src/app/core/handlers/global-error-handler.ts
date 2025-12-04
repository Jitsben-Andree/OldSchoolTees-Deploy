import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { LoggerService } from '../services/logger';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}
  handleError(error: any): void {
    const logger = this.injector.get(LoggerService);

    const message = error.message ? error.message : error.toString();

    logger.error('🔥 ERROR NO CONTROLADO:', message);

    console.error(error);
  }
}

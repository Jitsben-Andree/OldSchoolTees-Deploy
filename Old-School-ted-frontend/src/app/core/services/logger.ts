import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  constructor() { }

  log(message: string, ...args: any[]): void {
    this.print('LOG', 'green', message, args);
  }

  info(message: string, ...args: any[]): void {
    this.print('INFO', 'blue', message, args);
  }

  warn(message: string, ...args: any[]): void {
    this.print('WARN', 'orange', message, args);
  }

  error(message: string, ...args: any[]): void {
    this.print('ERROR', 'red', message, args);
  }

  private print(level: string, color: string, message: string, args: any[]): void {
    const timestamp = new Date().toISOString();
 
    const logPrefix = `[${timestamp}] [%c${level}%c]:`;
  
    console.log(logPrefix, `color: ${color}; font-weight: bold`, 'color: inherit', message, ...args);
  }
}
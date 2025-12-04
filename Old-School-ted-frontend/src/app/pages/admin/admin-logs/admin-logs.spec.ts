import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AdminLogsComponent } from './admin-logs';
import { MonitoringService } from '../../../core/services/monitoring';

describe('AdminLogsComponent', () => {
  let component: AdminLogsComponent;
  let fixture: ComponentFixture<AdminLogsComponent>;

  // Mock del servicio
  const monitoringServiceMock = {
    getSystemStatus: jasmine.createSpy('getSystemStatus').and.returnValue(of(null as any)),
    getSystemMetrics: jasmine.createSpy('getSystemMetrics').and.returnValue(of(null as any)),
    getRecentLogs: jasmine.createSpy('getRecentLogs').and.returnValue(of([])),
    downloadLogFile: jasmine
      .createSpy('downloadLogFile')
      .and.returnValue(of(new Blob()))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLogsComponent],   
      providers: [
        { provide: MonitoringService, useValue: monitoringServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call downloadLogFile when downloadLogs is executed', () => {
    component.downloadLogs();
    expect(monitoringServiceMock.downloadLogFile).toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MonitoringService } from './monitoring';

describe('MonitoringService', () => {
  let service: MonitoringService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],  
      providers: [MonitoringService]
    });

    service = TestBed.inject(MonitoringService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

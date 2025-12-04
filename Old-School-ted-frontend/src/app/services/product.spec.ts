import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ProductService } from './product';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ProductService);
  });

  it('debe crearse el servicio ProductService', () => {
    expect(service).toBeTruthy();
  });

  // Según tu HomeComponent, existe getAllProductosActivos()
  it('debe exponer el método getAllProductosActivos', () => {
    expect(typeof (service as any).getAllProductosActivos).toBe('function');
  });

  
});

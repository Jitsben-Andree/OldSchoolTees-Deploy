import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { UnlockAccountComponent } from './unlock';
import { AuthService } from '../../services/auth';

describe('UnlockAccountComponent', () => {
  let component: UnlockAccountComponent;
  let fixture: ComponentFixture<UnlockAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UnlockAccountComponent, 
        HttpClientTestingModule, 
        RouterTestingModule      
      ],

    }).compileComponents();

    fixture = TestBed.createComponent(UnlockAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

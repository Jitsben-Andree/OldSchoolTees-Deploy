import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive
  ],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
}
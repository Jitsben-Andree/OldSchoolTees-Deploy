import { Component, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { LoginRequest } from '../../models/login-request';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild('bgVideo') bgVideo!: ElementRef<HTMLVideoElement>;

  public errorMessage: string | null = null;
  public isSubmitting = false;

  ngAfterViewInit(): void {
    const video = this.bgVideo?.nativeElement;
    if (!video) return;

    // Silencio absoluto
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.removeAttribute('controls');

    // Candado
    const lockSilence = () => {
      if (!video.muted) video.muted = true;
      if (video.volume !== 0) video.volume = 0;
    };
    video.addEventListener('volumechange', lockSilence);
    video.addEventListener('loadedmetadata', lockSilence);
    video.addEventListener('play', lockSilence);

    // iOS/Android
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('x5-playsinline', '');

    const playVideo = () => {
      video.play().catch(() => {
        video.muted = true;
        video.volume = 0;
        setTimeout(() => video.play().catch(() => {}), 300);
      });
    };

    playVideo();
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    this.isSubmitting = true;
    const request: LoginRequest = form.value;

    this.authService.login(request).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/']); 
      },
      error: (err: Error) => { 
        this.isSubmitting = false;
        
       
        console.error("Error en login:", err.message);
        
        if (err.message.includes('CUENTA_BLOQUEADA') || err.message.includes('Tu cuenta está bloqueada')) {
          
          this.errorMessage = 'Tu cuenta ha sido bloqueada por seguridad.';
        } else {
          this.errorMessage = err.message || 'Error desconocido. Intente de nuevo.';
        }
      }
    });
  }
}
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';
import { PedidoService } from '../../services/pedido';
import { PedidoRequest } from '../../models/pedido-request';
import { Carrito } from '../../models/carrito';
import { HttpErrorResponse } from '@angular/common/http';
import { take, delay } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './checkout.html',
})
export class CheckoutComponent implements OnInit {
  // Servicios
  public cartService = inject(CartService);
  private pedidoService = inject(PedidoService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Estado
  public cart = signal<Carrito | null>(null);
  public checkoutForm: FormGroup;
  public isLoading = signal(false);
  public isProcessingPayment = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  // Métodos de pago 
  public metodosPago = [
    { value: 'YAPE', display: 'Yape', icon: '📱' }, 
    { value: 'PLIN', display: 'Plin', icon: '📱' },
    { value: 'TARJETA', display: 'Tarjeta de Crédito/Débito', icon: '💳' },
    { value: 'PAYPAL', display: 'PayPal', icon: '🅿️' },
    { value: 'TRANSFERENCIA', display: 'Transferencia Bancaria', icon: '🏦' }
  ];

  public yapeInfo = {
    numero: '987 654 321',
    qrUrl: 'https://placehold.co/150x150/FFEC44/000000?text=Scan+Yape+QR' 
  };
  public plinInfo = {
    numero: '912 345 678'
  };
  public transferenciaInfo = {
    banco: 'BCP Cuenta Corriente Soles',
    numeroCuenta: '191-XXXXXXXX-X-XX',
    cci: '002191XXXXXXXXXXXXXX'
  };


  constructor() {
    // Añadir controles para tarjeta (opcional, para simulación)
    this.checkoutForm = this.fb.group({
      direccionEnvio: ['', [Validators.required, Validators.minLength(10)]],
      metodoPagoInfo: ['TARJETA', Validators.required],
      numeroTarjeta: [''], 
      fechaExpiracion: [''], 
      cvc: ['']
    });

    //  Habilitar/Deshabilitar campos de tarjeta según método ---
    this.checkoutForm.get('metodoPagoInfo')?.valueChanges.subscribe(metodo => {
      const tarjetaControls = ['numeroTarjeta', 'fechaExpiracion', 'cvc'];
      if (metodo === 'TARJETA') {
        tarjetaControls.forEach(controlName => {
           this.checkoutForm.get(controlName)?.setValidators([Validators.required]); // Añadir validadores
           this.checkoutForm.get(controlName)?.enable();
        });
      } else {
         tarjetaControls.forEach(controlName => {
           this.checkoutForm.get(controlName)?.clearValidators(); // Quitar validadores
           this.checkoutForm.get(controlName)?.disable(); // Deshabilitar
           this.checkoutForm.get(controlName)?.reset(); // Limpiar valor
        });
      }
       // Actualizar estado de validación del formulario
       tarjetaControls.forEach(controlName => this.checkoutForm.get(controlName)?.updateValueAndValidity());
    });
     // Ejecutar una vez al inicio para deshabilitar si no es tarjeta
     if (this.checkoutForm.get('metodoPagoInfo')?.value !== 'TARJETA') {
        const tarjetaControls = ['numeroTarjeta', 'fechaExpiracion', 'cvc'];
        tarjetaControls.forEach(controlName => {
           this.checkoutForm.get(controlName)?.disable();
           this.checkoutForm.get(controlName)?.clearValidators();
        });
     }
    
  }

  ngOnInit(): void {
    const currentCart = this.cartService.cart();
    if (currentCart && currentCart.items.length > 0) {
      this.cart.set(currentCart);
    } else if (currentCart === null) {
      this.loadCart();
    } else {
      this.handleEmptyCart();
    }
  }

  loadCart() {
     this.isLoading.set(true);
     this.cartService.getMiCarrito().pipe(take(1)).subscribe({
      next: (loadedCart) => {
        this.isLoading.set(false);
        if (loadedCart && loadedCart.items.length > 0) {
           this.cart.set(loadedCart);
        } else {
           this.handleEmptyCart();
        }
      },
      error: (err) => {
         this.isLoading.set(false);
         console.error("Error cargando carrito en checkout:", err);
         this.errorMessage.set("No se pudo cargar tu carrito. Intenta de nuevo.");
      }
    });
   }

  handleEmptyCart() { 
     console.warn("Carrito vacío o error al cargar, redirigiendo...");
     this.router.navigate(['/cart']);
   }

  onSubmit() { 
    if (this.checkoutForm.invalid || !this.cart()) {
      this.checkoutForm.markAllAsTouched();
      if (!this.cart()) {
          this.errorMessage.set("Error: No se pudo cargar la información del carrito.");
      }
      return;
    }

    this.isProcessingPayment.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    console.log("Simulando procesamiento de pago...");

    setTimeout(() => {
        console.log("Simulación de pago completada. Creando pedido en backend...");
        this.crearPedidoEnBackend();
    }, 2000);
   }

  crearPedidoEnBackend() { 
    this.isLoading.set(true);
    const request: PedidoRequest = {
        direccionEnvio: this.checkoutForm.value.direccionEnvio,
        metodoPagoInfo: this.checkoutForm.value.metodoPagoInfo
    };

    console.log("Enviando PedidoRequest:", request);

    this.pedidoService.crearPedidoDesdeCarrito(request).pipe(take(1)).subscribe({
      next: (pedidoResponse) => {
        this.isLoading.set(false);
        this.isProcessingPayment.set(false);
        console.log("Pedido creado:", pedidoResponse);
        this.cartService.clearCartOnLogout();
        this.successMessage.set('¡Pedido realizado con éxito! Gracias por tu compra. Serás redirigido...');
        setTimeout(() => { this.router.navigate(['/mis-pedidos']); }, 2500);
      },
      error: (err: HttpErrorResponse | Error) => {
        this.isLoading.set(false);
        this.isProcessingPayment.set(false);
        const backendErrorMessage = err instanceof HttpErrorResponse ? err.error?.message || err.message : err.message;
        const displayMessage = backendErrorMessage || 'Ocurrió un error inesperado al procesar el pedido.';
        this.errorMessage.set(displayMessage);
        console.error('Error en crearPedidoDesdeCarrito:', err);
      }
    });
   }
}


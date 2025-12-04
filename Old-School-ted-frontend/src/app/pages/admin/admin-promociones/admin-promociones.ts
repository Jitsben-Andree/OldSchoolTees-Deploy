import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Importar DatePipe
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PromocionService } from '../../../services/promocion';
import { PromocionRequest, Promocion } from '../../../models/promocion';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs';

@Component({
  selector: 'app-admin-promociones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe], 
  templateUrl: './admin-promociones.html',
})
export class AdminPromocionesComponent implements OnInit {

  // Servicios
  private fb = inject(FormBuilder);
  private promocionService = inject(PromocionService);

  // Señales de estado
  public isLoading = signal(true);
  public error = signal<string | null>(null);
  public formError = signal<string | null>(null);

  // Señales de datos
  public promociones = signal<Promocion[]>([]);

  // Formulario Reactivo
  public promocionForm: FormGroup;

  // Estado de edición
  public editMode = signal(false);
  public currentEditPromocionId = signal<number | null>(null);

  constructor() {
    this.promocionForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(50)]],
      descripcion: ['', [Validators.required, Validators.maxLength(255)]],
      descuento: [null, [Validators.required, Validators.min(0.01), Validators.max(100)]],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      activa: [true]
    });
  }

  ngOnInit(): void {
    this.loadPromociones();
  }

  loadPromociones(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.promocionService.getAllPromociones().pipe(take(1)).subscribe({
      next: (data) => {
        this.promociones.set(data);
        this.isLoading.set(false);
      },
      error: (err: Error) => { // Usar Error genérico
        this.error.set('Error al cargar promociones: ' + err.message);
        this.isLoading.set(false);
        console.error("Error en loadPromociones:", err);
      }
    });
  }


  manejarSubmit(): void {
    if (this.promocionForm.invalid) {
      this.promocionForm.markAllAsTouched();
      this.formError.set("Por favor, complete todos los campos requeridos correctamente.");
      return;
    }

    // Convertir fechas a formato ISO antes de enviar
    const formValue = this.promocionForm.value;
    let fechaInicioISO: string | null = null;
    let fechaFinISO: string | null = null;
    try {
        fechaInicioISO = new Date(formValue.fechaInicio).toISOString();
        fechaFinISO = new Date(formValue.fechaFin).toISOString();
    } catch (e) {
        this.formError.set("Formato de fecha inválido.");
        console.error("Error al parsear fechas:", e);
        return;
    }

    // Validar que fecha fin sea posterior a fecha inicio
     if (fechaFinISO <= fechaInicioISO) {
        this.formError.set("La fecha de fin debe ser posterior a la fecha de inicio.");
        return;
     }


    const request: PromocionRequest = {
      codigo: formValue.codigo,
      descripcion: formValue.descripcion,
      descuento: formValue.descuento,
      fechaInicio: fechaInicioISO, // Enviar formato ISO
      fechaFin: fechaFinISO,       // Enviar formato ISO
      activa: formValue.activa
    };

    this.isLoading.set(true);
    this.formError.set(null);

    if (this.editMode()) {
      //  Lógica Editar 
      const id = this.currentEditPromocionId();
      if (!id) return;

      this.promocionService.actualizarPromocion(id, request).pipe(take(1)).subscribe({
        next: (updatedPromo) => {
          this.promociones.update(current =>
            current.map(p => p.idPromocion === id ? updatedPromo : p)
          );
          this.resetForm();
          this.isLoading.set(false);
        },
        error: (err: Error) => {
          this.formError.set("Error al actualizar promoción: " + err.message);
          this.isLoading.set(false);
        }
      });
    } else {
      //  Lógica Crear 
      this.promocionService.crearPromocion(request).pipe(take(1)).subscribe({
        next: (newPromo) => {
          this.promociones.update(current => [...current, newPromo]);
          this.resetForm();
          this.isLoading.set(false);
        },
        error: (err: Error) => {
          this.formError.set("Error al crear la promoción: " + err.message);
          this.isLoading.set(false);
        }
      });
    }
  }


  onEdit(promocion: Promocion): void {
    this.editMode.set(true);
    this.currentEditPromocionId.set(promocion.idPromocion);
    this.formError.set(null);

    // Formatear fechas para input datetime-local (YYYY-MM-DDTHH:mm)
    const fechaInicioLocal = this.formatDateForInput(promocion.fechaInicio);
    const fechaFinLocal = this.formatDateForInput(promocion.fechaFin);


    this.promocionForm.patchValue({
      codigo: promocion.codigo,
      descripcion: promocion.descripcion,
      descuento: promocion.descuento,
      fechaInicio: fechaInicioLocal,
      fechaFin: fechaFinLocal,
      activa: promocion.activa
    });
  }

  onDeactivate(id: number, codigo: string): void {
    if (!confirm(`¿Estás seguro de desactivar la promoción "${codigo}"?`)) {
      return;
    }

    this.isLoading.set(true); 
    this.error.set(null);

    this.promocionService.desactivarPromocion(id).pipe(take(1)).subscribe({
      next: () => {
        
        this.promociones.update(current =>
          current.map(p => p.idPromocion === id ? { ...p, activa: false } : p)
        );
        this.isLoading.set(false);
        if(this.currentEditPromocionId() === id) { this.resetForm(); } 
      },
      error: (err: Error) => {
        this.error.set("Error al desactivar promoción: " + err.message);
        this.isLoading.set(false);
      }
    });
  }

 
   private formatDateForInput(isoString: string): string {
       if (!isoString) return '';
       try {
            // Crear objeto Date y obtener componentes locales
            const date = new Date(isoString);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
            const day = date.getDate().toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            // Formato YYYY-MM-DDTHH:mm
            return `${year}-${month}-${day}T${hours}:${minutes}`;
       } catch (e) {
            console.error("Error formateando fecha para input:", isoString, e);
            return ''; 
       }
   }



  resetForm(): void {
    this.promocionForm.reset({ activa: true }); 
    this.editMode.set(false);
    this.currentEditPromocionId.set(null);
    this.formError.set(null);
  }

  //  TrackBy Function 
  trackById(index: number, item: Promocion): number {
    return item.idPromocion;
  }
}
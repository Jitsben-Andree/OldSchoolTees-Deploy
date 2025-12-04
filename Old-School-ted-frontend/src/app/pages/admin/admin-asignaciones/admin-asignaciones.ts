import { Component, OnInit, inject, signal, computed } from '@angular/core'; 
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsignacionService } from '../../../services/asignacion';
import { ProductService } from '../../../services/product';
import { ProveedorService } from '../../../services/proveedor'; 
import { AsignacionRequest, AsignacionResponse } from '../../../models/asignacion';
import { ProductoResponse } from '../../../models/producto';
import { Proveedor } from '../../../models/proveedor'; 
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, take } from 'rxjs';

@Component({
  selector: 'app-admin-asignaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './admin-asignaciones.html',
})
export class AdminAsignacionesComponent implements OnInit {

  // Servicios
  private fb = inject(FormBuilder);
  private asignacionService = inject(AsignacionService);
  private productService = inject(ProductService);
  private proveedorService = inject(ProveedorService);

  // Señales de estado
  public isLoading = signal(true);
  public error = signal<string | null>(null);
  public formError = signal<string | null>(null)

  // Señales de datos
  public productos = signal<ProductoResponse[]>([]);
  public proveedores = signal<Proveedor[]>([]);
  public asignaciones = signal<AsignacionResponse[]>([]);
  public selectedProductId = signal<number | null>(null);

  // Señal para modo edición
  public editMode = signal(false);
  public currentEditAsignacion = signal<AsignacionResponse | null>(null);

  // Formulario Reactivo
  public asignacionForm: FormGroup;

  public selectedProductName = computed(() => {
    const prodId = this.selectedProductId();
    const prods = this.productos();
    if (prodId === null || !prods || prods.length === 0) {
      return 'Producto Desconocido';
    }

    return prods.find(p => p.id === prodId)?.nombre || 'Producto Desconocido';
  });
 


  constructor() {
    this.asignacionForm = this.fb.group({
      productoId: [{ value: '', disabled: false }, Validators.required], // Habilitado al inicio
      proveedorId: ['', Validators.required],
      precioCosto: [null, [Validators.required, Validators.min(0.01)]]
    });

    // Escuchar cambios en productoId para cargar asignaciones
    this.asignacionForm.get('productoId')?.valueChanges.subscribe(productId => {
      if (productId) {
        this.selectedProductId.set(+productId); // Convertir a número
        this.loadAsignaciones(+productId);
        // Si estamos en modo edición, resetear al cambiar producto
        if (this.editMode()) {
           this.resetForm();
        }
      } else {
         this.selectedProductId.set(null);
         this.asignaciones.set([]); // Limpiar tabla si no hay producto seleccionado
      }
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  /**
   * Carga la lista inicial de productos y proveedores
   */
  loadInitialData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({ // Cargar ambos en paralelo
      productos: this.productService.getAllProductosAdmin().pipe(take(1)),
      proveedores: this.proveedorService.getAllProveedores().pipe(take(1))
    }).subscribe({
      next: ({ productos, proveedores }) => {
        this.productos.set(productos);
        this.proveedores.set(proveedores);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse | Error) => {
        const message = err instanceof HttpErrorResponse ? err.error?.message || err.message : err.message;
        this.error.set('Error al cargar datos iniciales: ' + message);
        this.isLoading.set(false);
        console.error("Error en loadInitialData:", err);
      }
    });
  }

  /**
   * Carga las asignaciones para el producto seleccionado
   */
  loadAsignaciones(productId: number): void {
     // No activar isLoading aquí para que el formulario siga visible
     // this.isLoading.set(true);
     this.asignacionService.getAsignacionesPorProducto(productId).pipe(take(1)).subscribe({
        next: (data) => {
            this.asignaciones.set(data);
             // this.isLoading.set(false); // No desactivar aquí
        },
        error: (err: HttpErrorResponse | Error) => {
            const message = err instanceof HttpErrorResponse ? err.error?.message || err.message : err.message;
            // Mostrar error específico de asignaciones si falla
            this.error.set(`Error al cargar asignaciones para producto ID ${productId}: ${message}`);
            this.asignaciones.set([]); // Limpiar tabla en caso de error
             // this.isLoading.set(false); // No desactivar aquí
             console.error(`Error en loadAsignaciones(${productId}):`, err);
        }
     });
  }


  /**
   * Maneja el envío del formulario (Crear o Editar Precio)
   */
  onSubmit(): void {
    if (this.asignacionForm.invalid) {
      this.asignacionForm.markAllAsTouched();
      this.formError.set("Por favor, complete todos los campos requeridos.");
      return;
    }

    this.isLoading.set(true); // Activar loading para la operación
    this.formError.set(null); // Limpiar error de formulario

    const formValue = this.asignacionForm.getRawValue(); // Usar getRawValue para incluir campos deshabilitados (productoId en edit)

    if (this.editMode()) {
      // --- Lógica de Editar Precio ---
      const asignacionAEditar = this.currentEditAsignacion();
      if (!asignacionAEditar) return; // Seguridad extra

      const request: { nuevoPrecioCosto: number } = { // Corregir tipo a UpdatePrecioRequest implícito
        nuevoPrecioCosto: formValue.precioCosto
      };

      this.asignacionService.updatePrecioCosto(asignacionAEditar.idAsignacion, request).pipe(take(1)).subscribe({
          next: (updatedAsignacion) => {
             // Actualizar localmente
             this.asignaciones.update(current =>
                current.map(a => a.idAsignacion === updatedAsignacion.idAsignacion ? updatedAsignacion : a)
             );
             this.resetForm(); // Limpiar formulario y salir de modo edición
             this.isLoading.set(false); // Desactivar loading
          },
          error: (err: Error) => { // Usar tipo Error
              this.formError.set("Error al actualizar precio: " + err.message);
              this.isLoading.set(false); // Desactivar loading
          }
      });

    } else {
      // --- Lógica de Crear Asignación ---
      const request: AsignacionRequest = {
        productoId: formValue.productoId,
        proveedorId: formValue.proveedorId,
        precioCosto: formValue.precioCosto
      };

       this.asignacionService.createAsignacion(request).pipe(take(1)).subscribe({
          next: (newAsignacion) => {
             // Añadir localmente si el producto seleccionado es el mismo
             if(this.selectedProductId() === newAsignacion.productoId) {
                this.asignaciones.update(current => [...current, newAsignacion]);
             }
             this.resetForm(); // Limpiar formulario
             this.isLoading.set(false); // Desactivar loading
             // Opcional: Recargar asignaciones si prefieres
             // this.loadAsignaciones(this.selectedProductId()!);
          },
          error: (err: Error) => { // Usar tipo Error
              this.formError.set("Error al crear asignación: " + err.message);
              this.isLoading.set(false); // Desactivar loading
          }
      });
    }
  }

  /**
   * Prepara el formulario para editar el precio de una asignación
   */
  onEdit(asignacion: AsignacionResponse): void {
    this.editMode.set(true);
    this.currentEditAsignacion.set(asignacion);
    this.formError.set(null); // Limpiar errores

    // Llenar formulario y deshabilitar selects
    this.asignacionForm.patchValue({
      productoId: asignacion.productoId,
      proveedorId: asignacion.proveedorId,
      precioCosto: asignacion.precioCosto
    });
    this.asignacionForm.get('productoId')?.disable();
    this.asignacionForm.get('proveedorId')?.disable();
  }

  /**
   * Elimina una asignación
   */
  onDelete(asignacionId: number, proveedorNombre: string): void {
    if (!confirm(`¿Estás seguro de eliminar la asignación con el proveedor "${proveedorNombre}"?`)) {
      return;
    }

     this.isLoading.set(true); // Activar loading para delete
     this.formError.set(null); // Limpiar errores

     this.asignacionService.deleteAsignacion(asignacionId).pipe(take(1)).subscribe({
        next: () => {
           // Eliminar localmente
           this.asignaciones.update(current => current.filter(a => a.idAsignacion !== asignacionId));
           this.isLoading.set(false); // Desactivar loading
           // Si estábamos editando esta asignación, resetear
           if(this.currentEditAsignacion()?.idAsignacion === asignacionId){
                this.resetForm();
           }
        },
        error: (err: Error) => { // Usar tipo Error
            this.formError.set("Error al eliminar asignación: " + err.message);
            this.isLoading.set(false); // Desactivar loading
        }
    });
  }

  /**
   * Resetea el formulario y sale del modo edición
   */
  resetForm(): void {
    this.asignacionForm.reset({ productoId: this.selectedProductId() || '', proveedorId: '', precioCosto: null }); // Mantener productoId si está seleccionado
    this.asignacionForm.get('productoId')?.enable(); // Habilitar select de producto
    this.asignacionForm.get('proveedorId')?.enable(); // Habilitar select de proveedor
    this.editMode.set(false);
    this.currentEditAsignacion.set(null);
    this.formError.set(null);
  }

  // --- TrackBy Functions (Opcional pero recomendado) ---
  trackProdById(index: number, item: ProductoResponse): number { return item.id; }
  trackProvById(index: number, item: Proveedor): number { return item.idProveedor; }
  trackAsigById(index: number, item: AsignacionResponse): number { return item.idAsignacion; }

}
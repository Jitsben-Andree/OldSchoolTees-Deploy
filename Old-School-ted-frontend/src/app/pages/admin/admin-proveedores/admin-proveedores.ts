import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProveedorService } from '../../../services/proveedor';
import { Proveedor } from '../../../models/proveedor';
import { ProveedorRequest } from '../../../models/proveedor-request';

@Component({
  selector: 'app-admin-proveedores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-proveedores.html',
})
export class AdminProveedoresComponent implements OnInit {

  // Inyección de servicios y FormBuilder
  private proveedorService = inject(ProveedorService);
  private fb = inject(FormBuilder);

  // Signals para manejar el estado
  public proveedores = signal<Proveedor[]>([]);
  public proveedorForm: FormGroup;
  public modoEdicion = signal(false);
  public proveedorIdActual = signal<number | null>(null);
  public error = signal<string | null>(null);

  constructor() {
    // Inicialización del formulario reactivo
    this.proveedorForm = this.fb.group({
      razonSocial: ['', [Validators.required, Validators.maxLength(150)]],
      contacto: ['', [Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(20)]],
      direccion: ['', [Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.cargarProveedores();
  }

  // Carga todos los proveedores desde el servicio
  cargarProveedores(): void {
    this.proveedorService.getAllProveedores().subscribe({
      next: (data) => this.proveedores.set(data),
      error: (err) => this.error.set('Error al cargar proveedores: ' + err.message)
    });
  }

  // Maneja el envío del formulario (Crear o Actualizar)
  manejarSubmit(): void {
    if (this.proveedorForm.invalid) {
      return;
    }

    this.error.set(null);
    const request: ProveedorRequest = this.proveedorForm.value;

    if (this.modoEdicion() && this.proveedorIdActual() !== null) {
      // --- MODO ACTUALIZAR ---
      this.proveedorService.updateProveedor(this.proveedorIdActual()!, request).subscribe({
        next: (proveedorActualizado) => {
          this.proveedores.update(provs =>
            provs.map(p => p.idProveedor === proveedorActualizado.idProveedor ? proveedorActualizado : p)
          );
          this.resetearFormulario();
        },
        error: (err) => this.error.set('Error al actualizar el proveedor: ' + err.message)
      });
    } else {
      // MODO CREAR 
      this.proveedorService.createProveedor(request).subscribe({
        next: (nuevoProveedor) => {
          this.proveedores.update(provs => [...provs, nuevoProveedor]);
          this.resetearFormulario();
        },
        error: (err) => this.error.set('Error al crear el proveedor: ' + err.message)
      });
    }
  }

  // Prepara el formulario para editar un proveedor existente
  cargarProveedorEnForm(proveedor: Proveedor): void {
    this.modoEdicion.set(true);
    this.proveedorIdActual.set(proveedor.idProveedor);
    this.proveedorForm.patchValue(proveedor); 
  }

  // Elimina un proveedor
  eliminarProveedor(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      this.error.set(null);
      this.proveedorService.deleteProveedor(id).subscribe({
        next: () => {
          this.proveedores.update(provs => provs.filter(p => p.idProveedor !== id));
        },
        error: (err) => {
           // Captura el error específico del backend (cuando el proveedor está en uso)
           this.error.set('Error al eliminar: ' + err.message)
        }
      });
    }
  }

  // Limpia el formulario y vuelve al modo "Crear"
  resetearFormulario(): void {
    this.proveedorForm.reset();
    this.modoEdicion.set(false);
    this.proveedorIdActual.set(null);
    this.error.set(null);
  }
}

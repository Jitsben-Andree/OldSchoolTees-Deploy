import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriaService } from '../../../services/categoria';
import { Categoria } from '../../../models/categoria';
import { CategoriaRequest } from '../../../models/categoria-request';

@Component({
  selector: 'app-admin-categorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-categorias.html',
})
export class AdminCategoriasComponent implements OnInit {

  // Inyección de servicios y FormBuilder
  private categoriaService = inject(CategoriaService);
  private fb = inject(FormBuilder);

  // Signals para manejar el estado
  public categorias = signal<Categoria[]>([]);
  public categoriaForm: FormGroup;
  public modoEdicion = signal(false);
  public categoriaIdActual = signal<number | null>(null);
  public error = signal<string | null>(null);

  constructor() {
    // Inicialización del formulario reactivo
    this.categoriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(255)]]
    });
  }

  ngOnInit(): void {
    this.cargarCategorias();
  }

  // Carga todas las categorías desde el servicio
  cargarCategorias(): void {
    this.categoriaService.getAllCategorias().subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => this.error.set('Error al cargar categorías')
    });
  }

  // Maneja el envío del formulario (Crear o Actualizar)
  manejarSubmit(): void {
    if (this.categoriaForm.invalid) {
      return; 
    }

    this.error.set(null); 
    const request: CategoriaRequest = this.categoriaForm.value;

    if (this.modoEdicion() && this.categoriaIdActual() !== null) {
      this.categoriaService.updateCategoria(this.categoriaIdActual()!, request).subscribe({
        next: (categoriaActualizada) => {
          // Actualiza la categoría en la lista del signal
          this.categorias.update(cats =>
            cats.map(c => c.idCategoria === categoriaActualizada.idCategoria ? categoriaActualizada : c)
          );
          this.resetearFormulario();
        },
        error: (err) => this.error.set('Error al actualizar la categoría')
      });
    } else {
      this.categoriaService.createCategoria(request).subscribe({
        next: (nuevaCategoria) => {
          this.categorias.update(cats => [...cats, nuevaCategoria]);
          this.resetearFormulario();
        },
        error: (err) => this.error.set('Error al crear la categoría')
      });
    }
  }

  // Prepara el formulario para editar una categoría existente
  cargarCategoriaEnForm(categoria: Categoria): void {
    this.modoEdicion.set(true);
    this.categoriaIdActual.set(categoria.idCategoria);
    this.categoriaForm.patchValue({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion
    });
  }

  // Elimina una categoría
  eliminarCategoria(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      this.error.set(null);
      this.categoriaService.deleteCategoria(id).subscribe({
        next: () => {
          this.categorias.update(cats => cats.filter(c => c.idCategoria !== id));
        },
        error: (err) => this.error.set('Error al eliminar la categoría. Asegúrate de que no esté en uso.')
      });
    }
  }

  // Limpia el formulario y vuelve al modo "Crear"
  resetearFormulario(): void {
    this.categoriaForm.reset();
    this.modoEdicion.set(false);
    this.categoriaIdActual.set(null);
    this.error.set(null);
  }
}


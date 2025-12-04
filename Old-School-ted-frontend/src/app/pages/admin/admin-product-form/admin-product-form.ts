import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product';
import { PromocionService } from '../../../services/promocion';
import { ProductoResponse } from '../../../models/producto';
import { Promocion } from '../../../models/promocion';
import { take } from 'rxjs';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-product-form.html',
})
export class AdminProductFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private promocionService = inject(PromocionService);

  public productForm: FormGroup;
  public categorias = signal<any[]>([]); 
  public error = signal<string | null>(null);
  public loading = signal<boolean>(false);
  
  public isEditMode = signal<boolean>(false);
  public currentProductId = signal<number | null>(null);
  public currentProduct = signal<ProductoResponse | null>(null);
  
  public currentProductImageUrl = signal<string | null>(null);
  public galleryImages = signal<{id: number, url: string}[]>([]); 
  public selectedMainFile = signal<File | null>(null);
  public isUploadingGallery = signal(false);

  public loadingPromociones = signal<boolean>(false);
  public allPromociones = signal<Promocion[]>([]);
  public associatedPromocionIds = computed(() => 
     this.currentProduct()?.promocionesAsociadas?.map((p: any) => p.idPromocion) ?? []
  );
  public availablePromociones = computed(() => 
     this.allPromociones().filter(p => !this.associatedPromocionIds().includes(p.idPromocion))
  );

  constructor() {
    this.productForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      descripcion: ['', [Validators.maxLength(500)]],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      talla: ['M', Validators.required],
      categoriaId: ['', Validators.required],
      activo: [true, Validators.required],
      colorDorsal: ['#000000', Validators.required],
      leyendas: this.fb.array([])
    });

    effect(() => {
       if (this.isEditMode() && this.currentProductId() !== null) {
          this.loadAllPromociones();
       }
    });
  }

  get leyendasArray() {
    return this.productForm.get('leyendas') as FormArray;
  }

  ngOnInit(): void {
    this.loadCategorias();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode.set(true);
        const pId = +id;
        this.currentProductId.set(pId);
        this.loadProductData(pId);
      } else {
        this.resetForm();
      }
    });
  }

  resetForm() {
    this.isEditMode.set(false);
    this.currentProductId.set(null);
    this.currentProduct.set(null);
    this.currentProductImageUrl.set(null);
    this.galleryImages.set([]);
    this.leyendasArray.clear();
    this.productForm.reset({ talla: 'M', activo: true, precio: 0, colorDorsal: '#000000' });
  }

  addLeyenda() {
    const leyendaGroup = this.fb.group({
      nombre: ['', Validators.required],
      numero: ['', Validators.required]
    });
    this.leyendasArray.push(leyendaGroup);
  }

  removeLeyenda(index: number) {
    this.leyendasArray.removeAt(index);
  }

  loadCategorias(): void {
     this.productService.getAllCategorias().subscribe({
      next: (data) => this.categorias.set(data),
      error: () => this.error.set('Error al cargar categorías.')
    });
  }

  loadAllPromociones(): void {
      this.promocionService.getAllPromociones().pipe(take(1)).subscribe({
          next: (data) => this.allPromociones.set(data.filter(p => p.activa)),
          error: () => console.error('Error cargando promociones')
      });
  }

  loadProductData(id: number): void {
    this.loading.set(true);
    this.productService.getProductoById(id).subscribe({
      next: (product) => {
        this.currentProduct.set(product);
        
        const catId = this.categorias().find(c => c.nombre === product.categoriaNombre)?.idCategoria || '';
        
        this.productForm.patchValue({
          nombre: product.nombre,
          descripcion: product.descripcion,
          precio: product.precioOriginal ?? product.precio,
          talla: product.talla,
          categoriaId: catId,
          activo: product.activo,
          colorDorsal: product.colorDorsal || '#000000'
        });

        this.leyendasArray.clear();
        if (product.leyendas && product.leyendas.length > 0) {
          product.leyendas.forEach((l: any) => {
            this.leyendasArray.push(this.fb.group({
              nombre: [l.nombre, Validators.required],
              numero: [l.numero, Validators.required]
            }));
          });
        }

        this.currentProductImageUrl.set(product.imageUrl || null);
        this.galleryImages.set(product.galeriaImagenes || []);
        
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el producto.');
        this.loading.set(false);
        this.router.navigate(['/admin/products']);
      }
    });
  }

  //  MÉTODOS DE IMÁGENES 
  onMainFileSelected(event: Event): void {
     const input = event.target as HTMLInputElement;
     if (input.files?.length) this.selectedMainFile.set(input.files[0]);
  }

  uploadMainImage(): void {
    if (!this.selectedMainFile() || !this.currentProductId()) return;
    this.loading.set(true);
    this.productService.uploadProductImage(this.currentProductId()!, this.selectedMainFile()!).subscribe({
      next: (res) => {
        this.currentProductImageUrl.set(res.imageUrl);
        this.selectedMainFile.set(null);
        this.loading.set(false);
      },
      error: () => { alert('Error al subir portada'); this.loading.set(false); }
    });
  }

  onGalleryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length && this.currentProductId()) {
      const file = input.files[0];
      this.isUploadingGallery.set(true);
      this.productService.uploadGalleryImage(this.currentProductId()!, file).subscribe({
        next: (res) => {
          this.galleryImages.set(res.galeriaImagenes || []);
          this.isUploadingGallery.set(false);
          input.value = ''; 
        },
        error: () => { alert('Error al subir imagen a galería'); this.isUploadingGallery.set(false); }
      });
    }
  }

  deleteGalleryImage(imgId: number): void {
    if (!confirm('¿Eliminar imagen?') || !this.currentProductId()) return;
    this.productService.deleteGalleryImage(this.currentProductId()!, imgId).subscribe({
      next: () => this.galleryImages.update(imgs => imgs.filter(i => i.id !== imgId)),
      error: () => alert('Error al eliminar imagen')
    });
  }

  //  GUARDAR PRODUCTO 
  onSubmit(): void {
    if (this.productForm.invalid) {
        this.productForm.markAllAsTouched();
        return;
    }
    this.loading.set(true);
    
    // Obtenemos los datos del formulario
    const req = this.productForm.value;
    
    // LOG DE DEPURACIÓN: Verifica en la consola del navegador (F12) qué se está enviando
    console.log("Enviando datos al backend:", req); 

    if (this.isEditMode() && this.currentProductId()) {
      this.productService.updateProducto(this.currentProductId()!, req).subscribe({
        next: (updated) => {
          this.currentProduct.set(updated);
          this.loading.set(false);
          alert('Producto actualizado con éxito');
        },
        error: (err) => { 
            this.error.set('Error al actualizar: ' + (err.message || 'Desconocido')); 
            this.loading.set(false); 
        }
      });
    } else {
      this.productService.createProducto(req).subscribe({
        next: (created) => {
          this.loading.set(false);
          alert('Producto creado.');
          this.router.navigate(['/admin/products/edit', created.id]);
        },
        error: (err) => { 
            this.error.set('Error al crear: ' + (err.message || 'Desconocido')); 
            this.loading.set(false); 
        }
      });
    }
  }
  
  onAssociatePromocion(id: number) {
     if(!this.currentProductId()) return;
     this.productService.associatePromocionToProducto(this.currentProductId()!, id)
       .subscribe(() => this.loadProductData(this.currentProductId()!));
  }
  
  onDisassociatePromocion(id: number) {
     if(!this.currentProductId()) return;
     this.productService.disassociatePromocionFromProducto(this.currentProductId()!, id)
       .subscribe(() => this.loadProductData(this.currentProductId()!));
  }
}
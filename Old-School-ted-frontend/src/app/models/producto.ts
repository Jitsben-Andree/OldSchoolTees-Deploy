//  PromocionSimpleDto
export interface PromocionSimple {
  idPromocion: number;
  codigo: string;
  descripcion: string;
  descuento: number;
  activa: boolean;
}

export interface ProductoResponse {
    id: number;
    nombre: string;
    descripcion: string;
    talla: string;
    precio: number;
    activo: boolean;
    categoriaNombre: string;
    stock: number;
    
    
    imageUrl: string; 
    galeriaImagenes: { id: number, url: string }[];

    colorDorsal?: string;
    leyendas?: { id: number, nombre: string, numero: string }[];

    precioOriginal?: number;
    descuentoAplicado?: number;
    nombrePromocion?: string;
    promocionesAsociadas?: any[];
}
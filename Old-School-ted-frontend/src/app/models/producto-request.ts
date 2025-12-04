export interface ProductoRequest {
    nombre: string;
    descripcion: string;
    talla: string;
    precio: number;
    activo: boolean;
    categoriaId: number;
    
    colorDorsal?: string;
    leyendas?: LeyendaDto[];
}

export interface LeyendaDto {
    nombre: string;
    numero: string;
}
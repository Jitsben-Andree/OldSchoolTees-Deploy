export interface PromocionRequest {
  codigo: string;
  descripcion: string;
  descuento: number;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
}

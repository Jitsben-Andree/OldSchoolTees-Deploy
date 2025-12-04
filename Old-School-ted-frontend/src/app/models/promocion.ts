export interface Promocion {
  idPromocion: number;
  codigo: string;
  descripcion: string;
  descuento: number; 
  fechaInicio: string; // En el backend es LocalDateTime, aquí usamos string (ISO format)
  fechaFin: string;    // En el backend es LocalDateTime, aquí usamos string (ISO format)
  activa: boolean;
}

// PromocionRequest.java
export interface PromocionRequest {
  codigo: string;
  descripcion: string;
  descuento: number;
  fechaInicio: string; // Enviar como string ISO (YYYY-MM-DDTHH:mm:ss)
  fechaFin: string;    // Enviar como string ISO (YYYY-MM-DDTHH:mm:ss)
  activa?: boolean;   
}

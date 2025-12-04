export interface Inventario {
  inventarioId: number;
  productoId: number;
  productoNombre: string;
  stock: number;
  ultimaActualizacion: string; // Usamos string para simplificar el manejo de LocalDateTime
}


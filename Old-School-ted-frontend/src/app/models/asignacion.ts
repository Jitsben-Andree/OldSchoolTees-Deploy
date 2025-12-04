export interface AsignacionResponse {
  idAsignacion: number;
  productoId: number;
  productoNombre: string;
  proveedorId: number;
  proveedorRazonSocial: string;
  precioCosto: number; 
}

// ProductoProveedorRequest
export interface AsignacionRequest {
  productoId: number;
  proveedorId: number;
  precioCosto: number; 
}

//UpdatePrecioCostoRequest

export interface UpdatePrecioRequest {
  nuevoPrecioCosto: number; 
}
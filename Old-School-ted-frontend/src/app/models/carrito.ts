export interface DetalleCarrito { 
      detalleCarritoId: number;
      productoId: number;
      productoNombre: string;
      cantidad: number;
      precioUnitario: number; 
      subtotal: number;      
      imageUrl?: string;
      stockActual?: number;      
    }

export interface Carrito {
  carritoId: number;
  usuarioId: number;
  items: DetalleCarrito[];
  total: number;
}

export interface AddItemRequest {
    productoId: number;
    cantidad: number;
    
    personalizacion?: {
        tipo: string;   
        nombre: string; 
        numero: string; 
        precio: number; 
    };
    parche?: {
        tipo: string;   
        precio: number; 
    };
}
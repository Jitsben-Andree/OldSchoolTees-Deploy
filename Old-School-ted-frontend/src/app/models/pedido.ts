export interface DetallePedido {
  detallePedidoId: number; 
  productoId: number;
  productoNombre: string; 
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  montoDescuento: number;
}

export interface UsuarioResumen {
  idUsuario: number;
  nombre: string;
  email: string;
}

export interface EnvioResumen {
  direccionEnvio: string;
  estadoEnvio: string;
  fechaEnvio?: string;
  codigoSeguimiento?: string;
}

export interface PagoResumen {
  estadoPago: string;
  metodoPago: string;
  fechaPago?: string;
}

export interface PedidoResponse {
  pedidoId: number;
  fecha: string;
  estado: string;
  total: number;
  
  // Propiedades planas principales (para la tabla)
  direccionEnvio: string;
  estadoEnvio: string;
  estadoPago: string;
  metodoPago: string;
  
  // Objetos y Listas
  detalles: DetallePedido[];
  
  // Usuario (Opcional porque en la lista a veces no viene completo, pero en detalle sí)
  usuarioId?: number;
  usuario?: UsuarioResumen;
}
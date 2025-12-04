// Basado en tu PedidoRequest.dto
export interface PedidoRequest {
  direccionEnvio: string;
  metodoPagoInfo: string; // Ej: "Yape", "Plin", "Tarjeta"
}

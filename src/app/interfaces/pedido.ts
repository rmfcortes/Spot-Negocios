import { Direccion } from './direccion';
import { Producto } from './producto';

export interface Pedido {
    aceptado: any;
    calificacion?: Calificacion;
    cliente: Cliente;
    createdAt: number;
    comision: number;
    entrega: string;
    entregado?: number;
    id?: string;
    negocio: Negocio;
    formaPago: FormaPago;
    productos: Producto[];
    repartidor?: RepartidorPedido;
    total: number;
    last_notification?: number;
    last_notificado?: string;
    last_solicitud?: number;
}

export interface Calificacion {
    negocio: CalificacionDetalles;
    repartidor: CalificacionDetalles;
}

export interface CalificacionDetalles {
    comentarios: string
    puntos: number
    idPedido: string
    fecha: number
}

export interface Negocio {
    categoria: string;
    direccion: Direccion;
    envio: number;
    idNegocio: string;
    logo: string;
    nombreNegocio: string;
    telefono: string;
}

export interface FormaPago {
    forma: string;
    tipo: string;
    id: string;
}

export interface NegocioPedido {
    entrega: string;
}

export interface Cliente {
    direccion: Direccion;
    nombre: string;
    telefono?: string;
    uid: string;
}

export interface RepartidorPedido {
    nombre: string;
    telefono: string;
    foto: string;
    lat?: number;
    lng?: number;
    id: string;
    externo: boolean;
    ganancia?: number;
}

export interface HistorialPedido {
    fecha: string
    pedidos: Pedido[];
    completados: Pedido[];
    cancelados_user: Pedido[];
    cancelados_negocio: Pedido[];
    ver_detalles: boolean;
}



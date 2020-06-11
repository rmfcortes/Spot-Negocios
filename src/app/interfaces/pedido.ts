import { Direccion } from './direccion';
import { Producto } from './producto';

export interface Pedido {
    aceptado: any;
    cliente: Cliente;
    entrega: string;
    id?: string;
    productos: Producto[];
    repartidor?: RepartidorPedido;
    total: number;
    negocio: NegocioPedido;
    last_notification?: number;
    last_notificado?: string;
    last_solicitud?: number;
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
}



import { Direccion } from './direccion';

export interface Perfil {
    id: string
    formas_pago: FormaPago
    nombre: string
    logo: string
    descripcion: string
    portada: string
    categoria: string
    subCategoria: string[]
    telefono: string
    direccion: Direccion
    tipo: string
    region: string
    display?: boolean
    productos?: number
    preparacion?: number
    entrega: string
    whats?: string
    correo: string
    contacto: string
    pass: string
    repartidores_propios: boolean
    envio?: number
    envio_gratis_pedMin?: number
    envio_costo_fijo?: boolean
    envio_desp_pedMin?: number
    plan: string
}

export interface FormaPago {
    efectivo: boolean;
    tarjeta: boolean;
}

export interface Region {
    ciudad: string;
    referencia: string;
    ubicacion: Ubicacion;
}

export interface Ubicacion {
    lat: number;
    lng: number;
}

export interface Categoria {
    categoria: string;
    foto: string;
}

export interface FunctionInfo {
    abierto: boolean;
    categoria: string;
    cuenta?: string;
    foto: string;
    idNegcio: string;
    nombre: string;
    subCategoria: string[];
    tipo: string;
}

export interface SubCategoria {
    cantidad: number;
    alias: string;
    subCategoria: string;
}

export interface IsOpen {
    abierto: boolean;
    idNegocio: string;
}

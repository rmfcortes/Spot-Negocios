export interface Producto {
    agotado: boolean;
    codigo?: string;
    descripcion: string;
    id: string;
    nombre: string;
    pasillo: string;
    precio: number;
    url: string;
    unidad?: string;
    variables?: boolean;
    foto?: string;
    // para pedido
    cantidad?: number;
    observaciones?: string;
    complementos?: ListaComplementosElegidos[];
    total?: number;
    mudar?: boolean;
    descuento?: number;
    dosxuno?: boolean;
    nuevo: boolean;
}

export interface ListaComplementosElegidos {
    titulo: string;
    complementos: ProductoComplemento[];
}

export interface ProductoComplemento {
    nombre: string;
    precio?: any;
}

export interface Complemento {
    titulo: string;
    obligatorio: boolean;
    limite: number;
    productos: ProductoComplemento[];
}

export interface ProductoPasillo {
    nombre: string;
    productos: Producto[];
}

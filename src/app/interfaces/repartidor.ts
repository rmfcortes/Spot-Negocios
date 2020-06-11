export interface Repartidor {
    detalles: RepartidorDetalles;
    preview: RepartidorPreview;
}

export interface RepartidorDetalles {
    edad: number;
    sexo: string;
    user: string;
    pass: string;
    correo: string;
}

export interface RepartidorPreview {
    calificaciones: number;
    foto: string;
    id: string;
    nombre: string;
    promedio: number;
    telefono: string;
}

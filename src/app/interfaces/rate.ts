export interface Rate {
    calificaciones: number;
    promedio: number;
}

export interface PerfilNegRate {
    id: string;
    logo: string;
    nombre: string;
}

export interface ComentarioNegocio {
    comentarios: string;
    idNegocio: string;
    puntos: number;
}

export interface ComentarioRepartidor {
    comentarios: string;
    idRepartidor: string;
    puntos: number;
}

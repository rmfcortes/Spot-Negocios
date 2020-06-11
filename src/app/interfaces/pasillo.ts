export interface InfoPasillos {
    pasillos: Pasillo[];
    vista: string;
    portada: string;
}

export interface Pasillo {
    nombre: string;
    prioridad: number;
    edit?: boolean;
}

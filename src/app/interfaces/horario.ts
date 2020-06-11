export interface Dia {
    nombre: string;
    activo: boolean;
    comida: string;
    apertura: string;
    cierre: string;
    inicioComida?: string;
    finComida?: string;
}

export interface DiaAnalisis {
    abierto?: boolean;
    activo: boolean;
    apertura?: number;
    cierre?: number;
    inicioComida?: number;
    finComida?: number;
}

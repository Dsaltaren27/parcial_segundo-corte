export interface Contact {
    id?: string;    
    name: string;  
    lastname?: string;
    phone: string | number; // El número de teléfono del contacto
    uid?: string; // UID del usuario al que pertenece el contacto
}

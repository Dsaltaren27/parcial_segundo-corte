export interface Contact {
    id?: string;    
    name: string;  
    lastname?: string;
    phone: string;
    uid?: string; // UID del usuario al que pertenece el contacto
}

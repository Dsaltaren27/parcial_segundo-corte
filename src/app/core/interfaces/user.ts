export interface User {
    id?: string;
    email: string;
    name: string;
    lastname: string;
    phone: string | number;
    uid?: string;
    fcmToken?: string;
     createdAt?: Date;
     updatedAt?: Date;
}

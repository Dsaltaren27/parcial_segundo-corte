export interface User {
    id?: string;
    email: string;
    name: string;
    lastname: string;
    phone: number;
    uid?: string;
    fcmToken?: string;
     createdAt?: Date;
     updatedAt?: Date;
}

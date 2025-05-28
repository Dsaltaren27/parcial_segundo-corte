// src/app/services/external-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@capacitor/storage';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://ravishing-courtesy-production.up.railway.app';
  private token: string | null = null;

  constructor(private http: HttpClient) {}

  loginToApi(email: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/user/login`, {
      email,
      password
    }).pipe(
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => new Error('Error al iniciar sesión'));
      })
    );
  }

  async getToken(): Promise<string | null> {
    if (this.token) return this.token;
    const { value } = await Storage.get({ key: 'api_token' });
    this.token = value;
    return value;
  }

  sendNotification(payload: any): Observable<any> {
    return new Observable(observer => {
      this.getToken().then(token => {
        if (!token) {
          observer.error(new Error('No hay token de autenticación'));
          return;
        }

        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        this.http.post(`${this.baseUrl}/notifications`, payload, { headers }).subscribe(
          response => observer.next(response),
          error => {
            console.error('Error al enviar notificación:', error);
            observer.error(new Error('Error al enviar notificación'));
          }
        );
      }).catch(error => {
        console.error('Error al obtener token:', error);
        observer.error(new Error('Error al obtener token'));
      });
    });
  }
}

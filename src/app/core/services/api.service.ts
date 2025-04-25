// src/app/services/external-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@capacitor/storage';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://ravishing-courtesy-production.up.railway.app';
  private token: string | null = null;

  constructor(private http: HttpClient) {}

  async loginToApi(email: string, password: string) {
    const res: any = await this.http.post(`${this.baseUrl}/user/login`, {
      email,
      password
    }).toPromise();

    this.token = res.token;
    await Storage.set({ key: 'api_token', value: res.token });
    return res.token;
  }

  async getToken() {
    if (this.token) return this.token;
    const { value } = await Storage.get({ key: 'api_token' });
    this.token = value;
    return value;
  }

  async sendNotification(payload: any) {
    const token = await this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.baseUrl}/notifications`, payload, { headers }).toPromise();
  }
}

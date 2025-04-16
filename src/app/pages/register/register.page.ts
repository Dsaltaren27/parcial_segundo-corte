
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage {
  name = '';
  lastname = '';
  phone = '';
  email = '';
  password = '';

  constructor(
    private authservice:AuthService,
    private router: Router
  ) {}

  async onRegister() {
    try {
      console.log('Guardando datos en Firestore:',  this.name, this.lastname, this.phone);
      await this.authservice.register(this.email, this.password, this.name, this.lastname, this.phone);
      this.showToast('Registro exitoso!');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al registrar:', error);
    }
  }

  private async showToast(message: string) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    document.body.appendChild(toast);
    await toast.present();
  }
}


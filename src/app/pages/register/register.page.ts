
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  nombre = '';
  apellido = '';
  telefono = '';
  email = '';
  password = '';

  constructor(
    private authservice:AuthService,
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  async onRegister() {
    try {
      await this.authservice.register(this.email, this.password, this.nombre, this.apellido, this.telefono);
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error al registrar:', error);
    }
  }
}


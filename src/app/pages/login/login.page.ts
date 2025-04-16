import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone:false
})
export class LoginPage {
  email = '';
  password = '';


  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onLogin() {
    try {
      const userCredential = await this.authService.login(this.email, this.password).toPromise();
      if (userCredential && userCredential.user) {
        this.showToast('Inicio de sesión exitoso!');
        this.router.navigate(['/home']);
      } else {
        alert('Inicio de sesión fallido. Verifique sus credenciales.');
      }
    } catch (error) {
     console.log('Error al iniciar sesión:', error);
      this.showToast('Correo o contraseña incorrectos');
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

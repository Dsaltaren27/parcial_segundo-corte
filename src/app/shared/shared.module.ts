import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { HeaderComponent } from './components/header/header.component';
import { AuthService } from '../core/services/auth.service';
import { AddContactComponent } from './components/add-contact/add-contact.component';

@NgModule({
  declarations: [
    HeaderComponent,
    AddContactComponent
  ],
  exports: [
    HeaderComponent,
    RouterModule,
    AddContactComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FormsModule // ✅ Agregado aquí
  ],
  providers: [

  ]
})
export class SharedModule {}
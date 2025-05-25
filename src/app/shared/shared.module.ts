import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { HeaderComponent } from './components/header/header.component';
import { AuthService } from '../core/services/auth.service';
import { AddContactComponent } from './components/add-contact/add-contact.component';
import { ChatComponent } from './components/chat/chat.component';

@NgModule({
  declarations: [
    HeaderComponent,
    AddContactComponent,
    ChatComponent
  ],
  exports: [
    HeaderComponent,
    RouterModule,
    AddContactComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FormsModule 
  ],
  providers: [

  ]
})
export class SharedModule {}
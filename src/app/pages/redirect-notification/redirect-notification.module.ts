import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RedirectNotificationPageRoutingModule } from './redirect-notification-routing.module';

import { RedirectNotificationPage } from './redirect-notification.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RedirectNotificationPageRoutingModule
  ],
  declarations: [RedirectNotificationPage]
})
export class RedirectNotificationPageModule {}

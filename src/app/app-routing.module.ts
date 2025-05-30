import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { ChatComponent } from './shared/components/chat/chat.component';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'start',
    pathMatch: 'full'
  },
  {
    path: 'start',
    loadChildren: () => import('./pages/start/start.module').then( m => m.StartPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule),
    canActivate: [NoAuthGuard]  // Protege la ruta de inicio de sesión
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule),
    canActivate: [AuthGuard]  // Protege la ruta de inicio
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then( m => m.RegisterPageModule),
    canActivate: [NoAuthGuard]  
  },
  {
    path: 'redirect-notification',
    loadChildren: () => import('./pages/redirect-notification/redirect-notification.module').then( m => m.RedirectNotificationPageModule),
    canActivate: [AuthGuard]  // Protege la ruta de notificación de redirección
  },
  {
    path: 'chat/:otherUserId',
    component:ChatComponent
  },  {
    path: 'userprofile',
    loadChildren: () => import('./pages/userprofile/userprofile.module').then( m => m.UserprofilePageModule)
  }




];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

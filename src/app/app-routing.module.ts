import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guard/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule), canActivate: [AuthGuard]
  },
  {
    path: 'historial',
    loadChildren: () => import('./pages/historial/historial.module').then(m => m.HistorialPageModule), canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'perfil',
    loadChildren: () => import('./pages/perfil/perfil.module').then(m => m.PerfilPageModule), canActivate: [AuthGuard]
  },
  {
    path: 'productos',
    loadChildren: () => import('./pages/productos/productos.module').then(m => m.ProductosPageModule), canActivate: [AuthGuard]
  },
  {
    path: 'repartidores',
    loadChildren: () => import('./pages/repartidores/repartidores.module').then(m => m.RepartidoresPageModule), canActivate: [AuthGuard]
  },
  {
    path: 'horario',
    loadChildren: () => import('./pages/horario/horario.module').then( m => m.HorarioPageModule), canActivate: [AuthGuard]
  },
  {
    path: 'rates',
    loadChildren: () => import('./pages/rates/rates.module').then( m => m.RatesPageModule), canActivate: [AuthGuard]
  },
  {
    path: 'busqueda',
    loadChildren: () => import('./pages/busqueda/busqueda.module').then( m => m.BusquedaPageModule), canActivate: [AuthGuard]
  },
  {
    path: 'planes',
    loadChildren: () => import('./pages/cuentas/cuentas.module').then( m => m.CuentasPageModule), canActivate: [AuthGuard]
  },
  {
    path: 'politica',
    loadChildren: './pages/politica/politica.module#PoliticaPageModule'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule {}

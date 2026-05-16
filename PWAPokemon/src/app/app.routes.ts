import { Routes } from '@angular/router';
import { Lista } from './pages/lista/lista';
import { Detalle } from './pages/detalle/detalle';
import { Buscar } from './pages/buscar/buscar';
import { Favoritos } from './pages/favoritos/favoritos';

export const routes: Routes = [
  { path: 'lista', component: Lista },
  { path: 'pokemon/:id', component: Detalle },
  { path: 'buscar', component: Buscar },
  { path: 'favoritos', component: Favoritos },
  { path: '**', redirectTo: 'lista' }
];
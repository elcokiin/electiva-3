import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'lista',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'favoritos',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'pokemon/:id',
    renderMode: RenderMode.Client  
  },
  {
    path: 'buscar',
    renderMode: RenderMode.Client  
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
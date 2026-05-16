import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { PokemonList, PokemonDetail } from '../interfaces/pokemon.interface';

const BASE = 'https://pokeapi.co/api/v2';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private favoritos: PokemonDetail[] = [];
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Solo acceder a localStorage si estamos en el navegador
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      const saved = localStorage.getItem('favoritos');
      if (saved) this.favoritos = JSON.parse(saved);
    }
  }

  getPokemones(offset = 0, limit = 20) {
    return this.http.get<PokemonList>(`${BASE}/pokemon?offset=${offset}&limit=${limit}`);
  }

  getPokemon(nameOrId: string | number) {
    return this.http.get<PokemonDetail>(`${BASE}/pokemon/${nameOrId}`);
  }

  guardarFavorito(pokemon: PokemonDetail) {
    if (!this.favoritos.find(f => f.id === pokemon.id)) {
      this.favoritos.push(pokemon);
      if (this.isBrowser) {
        localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
      }
    }
  }

  eliminarFavorito(id: number) {
    this.favoritos = this.favoritos.filter(f => f.id !== id);
    if (this.isBrowser) {
      localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
    }
  }

  getFavoritos(): PokemonDetail[] {
    return this.favoritos;
  }
}
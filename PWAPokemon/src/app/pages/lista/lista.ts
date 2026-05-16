import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { PokemonService } from '../../services/pokemon.service';
import { PokemonList } from '../../interfaces/pokemon.interface';

@Component({
  selector: 'app-lista',
  imports: [CommonModule, RouterLink, AsyncPipe],
  templateUrl: './lista.html'
})
export class Lista {
  offset = 0;
  limit = 20;
  pokemones$!: Observable<PokemonList>;

  constructor(private pokemonService: PokemonService) {
    this.cargar();
  }

  cargar() {
    this.pokemones$ = this.pokemonService.getPokemones(this.offset, this.limit);
  }

  siguiente() { this.offset += this.limit; this.cargar(); }
  anterior()  { if (this.offset > 0) { this.offset -= this.limit; this.cargar(); } }

  getId(url: string): string {
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }
}
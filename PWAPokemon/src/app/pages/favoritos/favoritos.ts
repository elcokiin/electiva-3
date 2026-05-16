import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PokemonService } from '../../services/pokemon.service';
import { PokemonDetail } from '../../interfaces/pokemon.interface';

@Component({
  selector: 'app-favoritos',
  imports: [CommonModule, RouterLink],
  templateUrl: './favoritos.html'
})
export class Favoritos {
  get favoritos(): PokemonDetail[] {
    return this.service.getFavoritos();
  }

  constructor(private service: PokemonService) {}

  eliminar(id: number) { this.service.eliminarFavorito(id); }
}
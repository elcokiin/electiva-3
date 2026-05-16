import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PokemonService } from '../../services/pokemon.service';
import { PokemonDetail } from '../../interfaces/pokemon.interface';

@Component({
  selector: 'app-buscar',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './buscar.html'
})
export class Buscar {
  termino = '';
  resultado?: PokemonDetail;
  error = '';
  cargando = false;

  constructor(
    private pokemonService: PokemonService,
    private cdr: ChangeDetectorRef   
  ) {}

  buscar() {
    if (!this.termino.trim()) return;

    this.error = '';
    this.resultado = undefined;
    this.cargando = true;

    this.pokemonService.getPokemon(this.termino.toLowerCase().trim())
      .subscribe({
        next: p => {
          this.resultado = p;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Pokémon no encontrado. Verifica el nombre o número.';
          this.cargando = false;
          this.cdr.detectChanges(); 
        }
      });
      
  }
}

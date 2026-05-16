import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PokemonService } from '../../services/pokemon.service';
import { PokemonDetail } from '../../interfaces/pokemon.interface';

@Component({
  selector: 'app-detalle',
  imports: [CommonModule, RouterLink, AsyncPipe],
  templateUrl: './detalle.html'
})
export class Detalle implements OnInit {
  pokemon$!: Observable<PokemonDetail>;
  guardado = false;

  constructor(
    private route: ActivatedRoute,
    private service: PokemonService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.pokemon$ = this.service.getPokemon(id).pipe(
      tap(p => {
        this.guardado = !!this.service.getFavoritos().find(f => f.id === p.id);
      })
    );
  }

  toggleFavorito(pokemon: PokemonDetail) {
    if (this.guardado) {
      this.service.eliminarFavorito(pokemon.id);
    } else {
      this.service.guardarFavorito(pokemon);
    }
    this.guardado = !this.guardado;
  }
}
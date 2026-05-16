export interface PokemonList {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonItem[];
}

export interface PokemonItem {
  name: string;
  url: string;
}
export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  sprites: {
    front_default: string;
    other: { 'official-artwork': { front_default: string } };
  };
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string } }[];
}
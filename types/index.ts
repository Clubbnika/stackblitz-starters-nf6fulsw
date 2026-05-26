export type Category = 'салати' | 'сендвічі' | 'супи' | 'десерти' | 'основні страви' | 'гарніри';
export type Provider = 'Провайдер А' | 'Провайдер Б' | 'Власноруч';
export type RandomFocus = 'all' | 'low_cal' | 'favorite';

export interface Ratings {
  taste: number;
  difficulty: number;
  healthiness: number;
  cost: number;
}

export interface Dish {
  id: string;
  name: string;
  category: Category;
  provider: Provider;
  calories: number;
  ratings: Ratings;
  averageRating: number;
}
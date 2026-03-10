export interface GameDeal {
  id: string;
  gameID: string;
  title: string;
  imageUrl: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  store: string;
  storeIcon: string;
  platform: string;
  url: string;
  expiresAt?: string;
  metacriticScore?: string;
  steamRatingPercent?: string;
  steamRatingText?: string | null;
  steamRatingCount?: string | null;
  releaseDate?: number;
  dealRating?: string;
}


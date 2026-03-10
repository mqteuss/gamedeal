export interface Store {
  storeID: string;
  storeName: string;
  isActive: number;
  images: {
    banner: string;
    logo: string;
    icon: string;
  };
}

export interface Deal {
  internalName: string;
  title: string;
  metacriticLink: string;
  dealID: string;
  storeID: string;
  gameID: string;
  salePrice: string;
  normalPrice: string;
  isOnSale: string;
  savings: string;
  metacriticScore: string;
  steamRatingText: string | null;
  steamRatingPercent: string;
  steamRatingCount: string;
  steamAppID: string | null;
  releaseDate: number;
  lastChange: number;
  dealRating: string;
  thumb: string;
}

const BASE_URL = 'https://www.cheapshark.com/api/1.0';

export async function getStores(): Promise<Store[]> {
  const response = await fetch(`${BASE_URL}/stores`);
  if (!response.ok) {
    throw new Error('Failed to fetch stores');
  }
  return response.json();
}

export interface GetDealsParams {
  storeID?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: 'Deal Rating' | 'Title' | 'Savings' | 'Price' | 'Metacritic' | 'Reviews' | 'Release' | 'Store' | 'Recent';
  desc?: boolean;
  lowerPrice?: number;
  upperPrice?: number;
  title?: string;
  onSale?: boolean;
}

export async function getDeals(params: GetDealsParams = {}): Promise<Deal[]> {
  const url = new URL(`${BASE_URL}/deals`);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch deals');
  }
  return response.json();
}

export interface GameDetails {
  info: {
    title: string;
    steamAppID: string | null;
    thumb: string;
  };
  cheapestPriceEver: {
    price: string;
    date: number;
  };
  deals: Array<{
    storeID: string;
    dealID: string;
    price: string;
    retailPrice: string;
    savings: string;
  }>;
}

export async function getGameDetails(gameID: string): Promise<GameDetails> {
  const response = await fetch(`${BASE_URL}/games?id=${gameID}`);
  if (!response.ok) {
    throw new Error('Failed to fetch game details');
  }
  return response.json();
}

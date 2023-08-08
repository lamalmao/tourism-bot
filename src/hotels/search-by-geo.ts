import Logger from '../logger.js';
import type { GuestData } from './entities.js';
import { makePostRequest } from './request.js';

interface IGeoRequest {
  latitude: number;
  longitude: number;
  radius: number;
  checkin: string;
  checkout: string;
  guests: Array<GuestData>;
  currency?: string;
  language: 'en' | 'ru' | string;
}

interface IGeoResponse {
  hotels: Array<{
    id: string;
    rates: Array<{
      daily_prices: Array<string>;
    }>;
  }>;
}

export function toISODate(date: Date) {
  // prettier-ignore
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${(date.getDate() + 1).toString().padStart(2, '0')}`;
}

export const LOCATIONS: {
  [key: string]: [number, number];
} = {
  simferopol: [44.5888, 33.5224],
  sevastopol: [44.9572, 34.1108],
  kerch: [45.3531, 36.4743],
  bakhchisaray: [44.74609, 33.86156]
};

async function searchHotelsByGeo(
  location: [number, number],
  guests: Array<GuestData>,
  checkin: string,
  checkout: string,
  language = 'ru',
  radius = 10000,
  currency = 'RUB'
) {
  try {
    const data = await makePostRequest<IGeoRequest, IGeoResponse>(
      'https://api.worldota.net/api/b2b/v3/search/serp/geo/',
      {
        checkin: checkin,
        checkout: checkout,
        guests,
        language,
        longitude: location[1],
        latitude: location[0],
        radius,
        currency
      }
    );

    return data;
  } catch (error) {
    Logger.error((error as Error).message);
    return null;
  }
}

export default searchHotelsByGeo;

import Logger from '../logger.js';
import type { HotelData } from './entities.js';
import { makePostRequest } from './request.js';

interface GetHotelRequest {
  id: string;
  language: 'ru' | 'en' | string;
}

async function getHotelData(id: string, language = 'ru') {
  try {
    const hotel = await makePostRequest<GetHotelRequest, HotelData>(
      'https://api.worldota.net/api/b2b/v3/hotel/info/',
      {
        id,
        language
      }
    );

    return hotel;
  } catch (error) {
    Logger.error((error as Error).message);
    return null;
  }
}

export default getHotelData;

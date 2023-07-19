import axios from 'axios';
import Logger from '../logger.js';
import settings from '../settings.js';

const APIUrl = 'https://geocode-maps.yandex.ru/1.x/';
const apikey = settings.yandex.geocoder;

async function getLocationDataByAddress(
  address: string,
  language = 'ru'
): Promise<[number, number] | undefined> {
  try {
    const response = await axios.get<{
      response?: {
        GeoObjectCollection: {
          featureMember: Array<{
            GeoObject: {
              Point: {
                pos: string;
              };
            };
          }>;
        };
      };
      statusCode?: number;
      error?: string;
      message?: string;
    }>(APIUrl, {
      params: {
        apikey,
        geocode: address,
        format: 'json',
        lang: language,
        results: 3
      }
    });

    const { data } = response;

    if (response.status !== 200) {
      throw new Error(`(${response.status}/${data.error}): ${data.message}`);
    }

    if (data.response) {
      const location = data.response.GeoObjectCollection.featureMember[0];
      if (!location) {
        throw new Error('Location not found');
      }

      const coordinates = location.GeoObject.Point.pos.split(' ');
      return [Number(coordinates[0]), Number(coordinates[1])];
    }
  } catch (error) {
    Logger.error((error as Error).message);
  }
}

export default getLocationDataByAddress;

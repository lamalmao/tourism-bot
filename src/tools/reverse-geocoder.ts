import axios from 'axios';
import Logger from '../logger.js';
import settings from '../settings.js';

const APIUrl = 'https://geocode-maps.yandex.ru/1.x/';
const apikey = settings.yandex.geocoder;

async function getLocationData(
  coordinates: [number, number],
  language = 'ru'
): Promise<Array<string> | undefined> {
  try {
    const response = await axios.get<{
      response?: {
        GeoObjectCollection: {
          featureMember: Array<{
            GeoObject: {
              metaDataProperty: {
                GeocoderMetaData: {
                  text: string;
                  Address: {
                    formatted: string;
                  };
                };
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
        geocode: coordinates.join(','),
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
      const result: Array<string> = [];
      for (const location of data.response.GeoObjectCollection.featureMember) {
        result.push(
          location.GeoObject.metaDataProperty.GeocoderMetaData.Address.formatted
        );
      }

      if (result.length !== 0) {
        return result;
      }
    }
  } catch (error) {
    Logger.error((error as Error).message);
  }
}

export default getLocationData;

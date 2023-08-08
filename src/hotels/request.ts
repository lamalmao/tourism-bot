import axios from 'axios';
import Logger from '../logger.js';
import settings from '../settings.js';

export async function makePostRequest<req extends object, res>(
  url: string,
  data: req
) {
  try {
    const result = await axios.post(url, data, {
      auth: {
        username: settings.b2b.id,
        password: settings.b2b.key
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (result.status !== 200) {
      throw new Error('B2B request error', {
        cause: result.data['error']
      });
    }

    return result.data.data as res;
  } catch (error) {
    Logger.error((error as Error).message);
    return null;
  }
}

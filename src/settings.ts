import path from 'path';
import fs from 'fs';
import Logger from './logger.js';

const set = {
  bot: {
    key: ''
  },
  db: '',
  yandex: {
    geocoder: ''
  },
  gpt: {
    key: ''
  }
};

type ISettings = typeof set;

class Settings {
  private _data: ISettings;

  private _checkObject(target: object, compareTo?: object) {
    try {
      const parent = compareTo ? compareTo : set;

      for (const key of Object.keys(parent)) {
        const value = target[key as keyof typeof target];
        if (!value) {
          throw new Error(`"${key}" must be provided in the settings file`);
        }

        const parentValue = parent[key as keyof typeof parent];
        const targetType = typeof value;
        const requiredType = typeof parentValue;

        if (targetType !== requiredType) {
          throw new Error(
            `Wrong type for key "${key}" - ${targetType}, must be - ${requiredType}`
          );
        }

        if (requiredType === 'object') {
          this._checkObject(value, parentValue as object);
        }
      }
    } catch (error) {
      Logger.error((error as Error).message, () => process.exit(1));
      console.log(
        'Error occurred while loading settings, see logs for details'
      );
    }
  }
  public constructor(settingsLocalPath: string) {
    const P = path.resolve(settingsLocalPath);
    if (!fs.existsSync(P)) {
      throw new Error('Settings file not found');
    }

    const settingsRawObject: ISettings = JSON.parse(
      fs.readFileSync(P).toString()
    ) as ISettings;

    this._checkObject(settingsRawObject);
    this._data = settingsRawObject;
  }

  public get settings(): ISettings {
    return structuredClone(this._data);
  }
}

const parsedSettings = new Settings('./settings.json');
const { settings } = parsedSettings;
export default settings;

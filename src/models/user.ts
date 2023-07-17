import { Schema, Document, model } from 'mongoose';

export const USER_LANGUAGES = {
  ru: 'ru',
  ua: 'ua',
  cn: 'cn',
  en: 'en',
  ar: 'ar',
  tt: 'tt'
};

export const MAPS_ALLOWED_USER_LANGUAGES = {
  ru: 'ru_RU',
  ua: 'uk_UA',
  en: 'en_US'
};

export interface ILocation {
  coordinates: [number, number];
  title: string;
}

const LocationSchema = new Schema<ILocation>(
  {
    coordinates: {
      type: [Number, Number],
      required: true
    },
    title: {
      type: String,
      required: true
    }
  },
  {
    autoIndex: false
  }
);

export interface IUser extends Document {
  telegramId: number;
  blockedByUser: boolean;
  language: string;
  joinDate: Date;
  location: ILocation;
}

const UserSchema = new Schema<IUser>({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  language: {
    type: String,
    required: true,
    enum: Object.values(USER_LANGUAGES),
    default: USER_LANGUAGES.ru
  },
  blockedByUser: {
    type: Boolean,
    default: false
  },
  joinDate: {
    type: Date,
    default: () => new Date()
  },
  location: LocationSchema
});

const User = model('users', UserSchema);
export default User;

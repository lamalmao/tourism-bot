import path from 'path';
import { I18n } from 'i18n';
import { USER_LANGUAGES } from '../models/user.js';
import YAML from 'yaml';

const localization = new I18n({
  locales: Object.values(USER_LANGUAGES),
  defaultLocale: USER_LANGUAGES.en,
  directory: path.resolve('./locales'),
  parser: YAML,
  extension: '.yml',
  objectNotation: true
});

export default localization;

import { Scenes, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import type { Bot } from '../index.js';
import localization from '../localization.js';
import searchHotelsByGeo from '../../hotels/search-by-geo.js';
import replyWithError from '../actions/reply-with-error.js';
import Logger from '../../logger.js';
import getHotelData from '../../hotels/get-hotel-data.js';
import escapeHTML from '../../escaper.js';
import type { InputMediaPhoto } from 'telegraf/types';
import { HOTEL_TYPES } from '../../hotels/entities.js';

// const pageSize = 5;

const hotelsList = new Scenes.BaseScene<Bot>('hotels-list');

hotelsList.enterHandler = async ctx => {
  try {
    const user = ctx.session.userInstance;
    if (!user || !ctx.from) {
      throw new Error('No user data');
    }

    const searchData = ctx.session.hotelSearch as Required<
      typeof ctx.session.hotelSearch
    >;
    if (!searchData) {
      throw new Error('No search data');
    }

    if (!ctx.session.hotelsList) {
      ctx.session.hotelsList = {
        foundHotels: [],
        hotels: [],
        page: 0
      };
    }

    if (ctx.session.hotelsList.foundHotels.length === 0) {
      const searchMessage = await ctx.reply(
        localization.__({
          locale: user.language,
          phrase: 'hotels.search.searching'
        })
      );
      await ctx.sendChatAction('typing');

      const searchLanguage = user.language === 'ru' ? 'ru' : 'en';
      const found = await searchHotelsByGeo(
        searchData.coordinates,
        searchData.guests,
        searchData.checkInDate,
        searchData.checkOutDate,
        searchLanguage
      );

      if (!found || found.hotels.length === 0) {
        throw new Error('hotels.errors.nothing-found');
      }

      ctx.deleteMessage(searchMessage.message_id).catch(() => null);
      ctx.session.hotelsList.foundHotels = found.hotels;
    }

    if (ctx.session.hotelsList.hotels.length === 0) {
      const tasks: Array<Promise<Awaited<ReturnType<typeof getHotelData>>>> =
        [];
      for (const foundHotel of ctx.session.hotelsList.foundHotels) {
        tasks.push(getHotelData(foundHotel.id));
      }

      const filtered: typeof ctx.session.hotelsList.foundHotels = [];
      const type = HOTEL_TYPES[searchData.type];

      const results = await Promise.allSettled(tasks);
      for (const result of results) {
        if (
          result.status === 'fulfilled' &&
          result.value !== null &&
          result.value.kind === type
        ) {
          ctx.session.hotelsList.hotels.push(result.value);

          const foundValue =
            ctx.session.hotelsList.foundHotels[
              ctx.session.hotelsList.foundHotels.findIndex(
                value => value.id === result.value?.id
              )
            ];
          filtered.push(foundValue);
        }
      }

      ctx.session.hotelsList.foundHotels = filtered;
    }

    if (ctx.session.hotelsList.hotels.length === 0) {
      throw new Error('hotels.errors.nothing-found');
    }

    const { hotels, page } = ctx.session.hotelsList;
    let i = page * 5;
    let current = hotels[i];
    while (i < (page + 1) * 5 && current) {
      console.log(i);
      let description = '';
      for (const descriptionItem of current.description_struct) {
        // prettier-ignore
        description = description.concat(`<b>${escapeHTML(descriptionItem.title)}</b>\n${escapeHTML(descriptionItem.paragraphs)}\n\n`)
      }

      const price = ctx.session.hotelsList.foundHotels[i].rates
        ? ctx.session.hotelsList.foundHotels[i].rates[0]
          ? ctx.session.hotelsList.foundHotels[i].rates[0].daily_prices.join(
              '/'
            ) + ' ₽'
          : '-'
        : '-';

      const text = localization.__(
        {
          locale: user.language,
          phrase: 'hotels.search.short-data'
        },
        {
          name: escapeHTML(current.name),
          address: escapeHTML(current.address),
          number: (i + 1).toString(),
          description,
          price: escapeHTML(price)
        }
      );

      const mediaGroup: Array<InputMediaPhoto> = [];
      for (const image of current.images.slice(0, 10)) {
        mediaGroup.push({
          type: 'photo',
          media: {
            url: image.replaceAll(/\{size\}/gi, '1024x768')
          }
        });
      }

      await ctx.reply(text, {
        parse_mode: 'HTML'
      });
      await ctx.replyWithMediaGroup(mediaGroup);
      i++;
      current = hotels[i];
    }

    await ctx.reply(
      localization.__({
        locale: user.language,
        phrase: 'hotels.search.choose-hotel'
      })
    );
  } catch (error) {
    console.log(error);
    const errorMessage = (error as Error).message;
    replyWithError(
      ctx,
      errorMessage.startsWith('hotels')
        ? localization.__({
            phrase: errorMessage,
            locale: ctx.from?.language_code === 'ru' ? 'ru' : 'en'
          })
        : errorMessage
    );
    Logger.error(errorMessage);
    ctx.scene.enter('menu');
  }
};

hotelsList.on(message('text'), async ctx => {
  try {
    if (!ctx.session.hotelsList || !ctx.session.userInstance) {
      throw new Error('Session data lost');
    }

    const rawData = /(\d+)/.exec(ctx.message.text);
    if (!rawData) {
      throw new Error('hotels.errors.specify-number');
    }

    const number = Number(rawData[1]);

    const hotel = ctx.session.hotelsList.hotels[number];
    if (!hotel) {
      throw new Error('hotels.errors.hotel-not-found');
    }

    let rooms = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyboard: Array<any> = [];
    let roomNumber = 0;
    const images: Array<InputMediaPhoto> = [];
    for (const room of hotel.room_groups) {
      rooms = rooms.concat(`${escapeHTML(room.name)}\n`);
      if (room.images && room.images[0]) {
        images.push({
          type: 'photo',
          media: {
            url: room.images[0].replaceAll(/\{size\}/g, '1024x768')
          }
        });
      }

      keyboard.push([
        Markup.button.callback(room.name, `get-room:${hotel.id}:${roomNumber}`)
      ]);
      roomNumber++;
    }
    keyboard.push([
      Markup.button.callback('Проложить маршрут', `getRoute:${hotel.id}`)
    ]);

    let amenities = '';
    for (const amenityGroup of hotel.amenity_groups) {
      // prettier-ignore
      amenities = amenities.concat(`<b>${escapeHTML(amenityGroup.group_name)}</b>\n${escapeHTML(amenityGroup.amenities.join('\n'))}\n\n`)
    }

    let description = '';
    for (const item of hotel.description_struct) {
      // prettier-ignore
      description = description.concat(`<b>${escapeHTML(item.title)}</b>`, '\n', escapeHTML(item.paragraphs), '\n\n')
    }
    description += '\n';

    const message = localization.__(
      {
        locale: ctx.session.userInstance.language,
        phrase: 'hotels.search.full-data'
      },
      {
        name: escapeHTML(hotel.name),
        address: escapeHTML(hotel.address),
        floorsNumber: hotel.facts.floors_number
          ? hotel.facts.floors_number.toString()
          : '1',
        roomsNumber: hotel.facts.rooms_number
          ? hotel.facts.rooms_number.toString()
          : '-',
        buildYear: hotel.facts.year_built
          ? hotel.facts.year_built.toString()
          : '-',
        amenities,
        rooms,
        description,
        phone: escapeHTML(hotel.phone ? hotel.phone : '-'),
        mail: escapeHTML(hotel.email ? hotel.email : '-'),
        checkIn: escapeHTML(hotel.check_in_time),
        checkOut: escapeHTML(hotel.check_out_time)
      }
    );

    const length = message.length;
    const limit = 4050;
    if (length > limit) {
      const partsCount = Math.ceil(length / limit);
      for (let i = 0; i < partsCount; i++) {
        await ctx.reply(message.slice(i * limit, (i + 1) * limit), {
          parse_mode: 'HTML',
          reply_markup:
            i === partsCount
              ? Markup.inlineKeyboard(keyboard).reply_markup
              : undefined
        });
      }
    } else {
      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup
      });
    }

    await ctx.replyWithMediaGroup(images);
  } catch (error) {
    console.log(error);
    const errorMessage = (error as Error).message;
    replyWithError(
      ctx,
      errorMessage.startsWith('hotels')
        ? localization.__({
            phrase: errorMessage,
            locale: ctx.from?.language_code === 'ru' ? 'ru' : 'en'
          })
        : errorMessage
    );
    Logger.error(errorMessage);
  }
});

export default hotelsList;

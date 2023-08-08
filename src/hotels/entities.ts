export interface GuestData {
  adults: number;
  children?: [];
}

export type HotelType =
  | 'Resort'
  | 'Sanatorium'
  | 'Guesthouse'
  | 'Mini-hotel'
  | 'Castle'
  | 'Hotel'
  | 'Boutique_and_Design'
  | 'Apartment'
  | 'Cottages_and_Houses'
  | 'Farm'
  | 'Villas_and_Bungalows'
  | 'Camping'
  | 'Hostel'
  | 'BNB'
  | 'Apart-hotel'
  | 'Glamping';

export const HOTEL_TYPES: Array<HotelType> = [
  'Resort',
  'Sanatorium',
  'Guesthouse',
  'Mini-hotel',
  'Hotel',
  'Boutique_and_Design',
  'Apartment',
  'Cottages_and_Houses',
  'Farm',
  'Villas_and_Bungalows',
  'Camping',
  'Hostel',
  'Apart-hotel',
  'Glamping'
];

export interface AmenityGroup {
  group_name: string;
  amenities: Array<string>;
}

export interface HotelData {
  id: string;
  name: string;
  email: string;
  phone: string;
  room_groups: Array<RoomGroup>;
  check_in_time: string;
  check_out_time: string;
  address: string;
  description_struct: Array<DescriptionItem>;
  facts: Facts;
  amenity_groups: Array<AmenityGroup>;
  images: Array<string>;
  kind: HotelType;
  star_rating: number;
}

export interface Amenities {
  group_name: string;
  amenities: Array<string>;
}

export interface DescriptionItem {
  title: string;
  paragraphs: string;
}

export interface Facts {
  electricity: {
    frequency: Array<number>;
    sockets: Array<string>;
  };
  floors_number: number;
  rooms_number: number;
  year_built: number;
  year_renovated: number;
}

export interface RoomGroup {
  name: string;
  name_struct: {
    bathroom: string | null;
    bedding_type: string;
    main_name: string;
  };
  images: Array<string>;
}

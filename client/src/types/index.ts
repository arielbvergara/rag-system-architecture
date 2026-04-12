export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MenuItem {
  title: string;
  description: string;
  price1Description: string;
  price1: string;
  price2Description?: string;
  price2?: string;
  imageUrl: string;
  ingredients?: string;
}

export interface MenuSection {
  name: string;
  items: MenuItem[];
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string }[];
}

export interface SheetData {
  range: string;
  values: string[][];
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
}

export interface PlaceReview {
  authorName: string;
  rating: number;
  text: string;
  relativeTimeDescription: string;
  profilePhotoUrl?: string;
}

export interface PlaceDetails {
  name: string;
  address: string;
  rating: number;
  totalReviews: number;
  reviews: PlaceReview[];
  mapsUrl: string;
}

export interface NearbyRestaurant {
  name: string;
  description: string;
  mapsUrl: string;
}

export interface CloudinaryImage {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface ScannedMenuItem {
  name: string;
  description: string;
  price: string;
}

export interface ScannedMenuSection {
  section: string;
  items: ScannedMenuItem[];
}

export interface MenuScanResult {
  sections: ScannedMenuSection[];
  scannedAt: string;
  sheetUrl: string;
}

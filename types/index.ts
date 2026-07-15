// Shared domain types for travel bundles and feed UI.

export type TripType = 'Flight + Stay' | 'Villa' | 'Experience' | 'Hotel';

export interface DayHighlight {
  day: number;
  title: string;
  icon: string;
}

export interface TravelBundle {
  id: string;
  destination: string;
  tripType: TripType;
  price: number;
  duration: string;
  rating: number;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  highlights: DayHighlight[];
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  status: 'complete' | 'streaming';
}

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DESTINATIONS = [
  'Bali, Indonesia',
  'Maldives',
  'Tokyo, Japan',
  'Paris, France',
  'Santorini, Greece',
  'Dubai, UAE',
  'Kyoto, Japan',
  'Barcelona, Spain',
  'Reykjavik, Iceland',
  'Queenstown, New Zealand',
  'Kerala, India',
  'Goa, India',
  'Manali, India',
  'Ladakh, India',
  'Singapore',
  'Bangkok, Thailand',
  'Rome, Italy',
  'London, UK',
  'Swiss Alps',
  'Marrakech, Morocco',
  'Cusco, Peru',
  'Costa Rica',
  'Bergen, Norway',
  'Maui, Hawaii',
  'Sydney, Australia',
  'Cape Town, South Africa',
  'Istanbul, Turkey',
  'Prague, Czechia',
  'Vienna, Austria',
  'Amalfi Coast, Italy',
  'Jaipur, India',
  'Udaipur, India',
  'Phuket, Thailand',
  'Seoul, South Korea',
  'Lisbon, Portugal',
  'Zermatt, Switzerland',
  'Mauritius',
  'Bora Bora',
  'Petra, Jordan',
  'Serengeti, Tanzania',
];

const TRIP_TYPES = ['Flight + Stay', 'Villa', 'Experience', 'Hotel'];

const DURATIONS = [
  '3 nights',
  '4 nights',
  '5 nights',
  '6 nights',
  '7 nights',
  '8 nights',
  '10 nights',
  '12 nights',
];

const HIGHLIGHT_POOL = [
  { title: 'Arrival and local food tour', icon: '🍜' },
  { title: 'Guided city walk', icon: '🚶' },
  { title: 'Sunset viewpoint visit', icon: '🌅' },
  { title: 'Beach and water activities', icon: '🏖️' },
  { title: 'Mountain trek', icon: '🏔️' },
  { title: 'Temple and heritage trail', icon: '🛕' },
  { title: 'Wine and culture evening', icon: '🍷' },
  { title: 'Island hopping cruise', icon: '🚤' },
  { title: 'Local market exploration', icon: '🛍️' },
  { title: 'Wildlife safari', icon: '🦁' },
  { title: 'Spa and wellness session', icon: '💆' },
  { title: 'Cooking class with chef', icon: '👨‍🍳' },
  { title: 'Scenic train ride', icon: '🚆' },
  { title: 'Hot air balloon ride', icon: '🎈' },
  { title: 'Departure with airport transfer', icon: '✈️' },
];

function pickHighlights(index) {
  const count = 3 + (index % 2);
  const highlights = [];

  for (let i = 0; i < count; i += 1) {
    const poolIndex = (index * 3 + i * 5) % HIGHLIGHT_POOL.length;
    highlights.push({
      day: i + 1,
      title: HIGHLIGHT_POOL[poolIndex].title,
      icon: HIGHLIGHT_POOL[poolIndex].icon,
    });
  }

  return highlights;
}

function createBundle(index) {
  const destination = DESTINATIONS[index % DESTINATIONS.length];
  const tripType = TRIP_TYPES[index % TRIP_TYPES.length];
  const duration = DURATIONS[index % DURATIONS.length];
  const priceBase = tripType === 'Villa' ? 1800 : tripType === 'Experience' ? 900 : 1200;
  const price = priceBase + (index % 12) * 175 + (index % 3) * 50;
  const rating = Number((3.6 + (index % 15) * 0.1).toFixed(1));

  return {
    id: `bundle-${String(index + 1).padStart(3, '0')}`,
    destination: index % 7 === 0 ? `${destination} Escape` : destination,
    tripType,
    price,
    duration,
    rating: Math.min(rating, 5),
    imageUrl: `https://picsum.photos/seed/crew-${index + 1}/800/500`,
    imageWidth: 800,
    imageHeight: 500,
    highlights: pickHighlights(index),
  };
}

const bundles = Array.from({ length: 120 }, (_, index) => createBundle(index));
const outputPath = join(__dirname, '../data/travelBundles.json');

writeFileSync(outputPath, `${JSON.stringify(bundles, null, 2)}\n`);
console.log(`Generated ${bundles.length} travel bundles at ${outputPath}`);

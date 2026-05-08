import { Note, ChecklistItem } from '../types';

export const notes: Note[] = [
  // Tokyo notes (trip-1)
  {
    id: 'note-1',
    tripId: 'trip-1',
    title: 'Flight Booking Research',
    content: 'ANA direct from LAX to NRT is currently $880 round-trip per person. JAL is slightly more at $950 but has better legroom. Both are Star Alliance partners so we can use miles for upgrades. Check again on Tuesday for price drops. Must book before prices go up for summer season.',
    createdAt: '2026-03-15T10:30:00Z',
  },
  {
    id: 'note-2',
    tripId: 'trip-1',
    title: 'Sushi Class Booking Details',
    content: 'Booked through AirKitchen with host Yuki. Location is a 10-minute walk from Asakusa station. Class starts at 8:30 AM on July 17. She will provide all ingredients and tools. Total cost is $85 per person. She said to mention any allergies in advance. We will make 3 types of nigiri and 2 types of maki.',
    createdAt: '2026-04-02T14:15:00Z',
  },
  {
    id: 'note-3',
    tripId: 'trip-1',
    title: 'Hakone Day Trip Logistics',
    content: 'Buy the Hakone Free Pass from Shinjuku station (2-day pass is 6100 JPY). It covers the Romancecar, all transport in the area, and discounts at museums. Check weather forecast the night before - if cloudy, skip the ropeway and do more onsen time instead. Pack a small day bag with swim gear and a towel for the onsen.',
    createdAt: '2026-05-01T09:00:00Z',
  },

  // Paris notes (trip-2)
  {
    id: 'note-4',
    tripId: 'trip-2',
    title: 'Anniversary Dinner Plans',
    content: 'Le Cinq reservation confirmed for June 20 at 7:30 PM. Confirmation number: LC-2026-4872. Dress code is elegant - jacket recommended for men. They will prepare a special dessert plate if we mention the anniversary. Also booked Septime for June 21 at 7:00 PM. Both require 48-hour cancellation notice.',
    createdAt: '2026-04-10T16:45:00Z',
  },
  {
    id: 'note-5',
    tripId: 'trip-2',
    title: 'Museum Pass Strategy',
    content: '4-day Paris Museum Pass covers Louvre, Orsay, Orangerie, Versailles, and more. Buy at the first museum we visit or online in advance. Skip-the-line access at most places. Plan museums for mornings when energy is highest. Note: Eiffel Tower summit is NOT included in the pass.',
    createdAt: '2026-05-05T11:20:00Z',
  },

  // Bali notes (trip-3)
  {
    id: 'note-6',
    tripId: 'trip-3',
    title: 'Villa vs Hotel Decision',
    content: 'Decided on a villa in Ubud for the first 4 nights (Villa Karna - $150/night, private pool, rice field view) and a hotel in Seminyak for the last 3 nights (The Samaya - $200/night, beachfront). Splitting 4 ways with the group makes it very affordable. Villas have kitchen so we can cook breakfast. Hotels have better beach access.',
    createdAt: '2026-04-20T08:30:00Z',
  },
  {
    id: 'note-7',
    tripId: 'trip-3',
    title: 'Snorkeling Day Trip Options',
    content: 'Nusa Penida day trip is $65 per person including speedboat, 2 snorkel stops (Manta Point and Crystal Bay), and lunch. Alternative is a cheaper local snorkeling day at Amed for $35 per person. Going with Nusa Penida since the group wants to see the mantas. Book through Bali Sunshine Tours - good reviews on TripAdvisor.',
    createdAt: '2026-05-08T13:00:00Z',
  },
  {
    id: 'note-8',
    tripId: 'trip-3',
    title: 'Group Coordination Notes',
    content: 'Group of 4: us + Jake and Maria. Jake is PADI certified and wants to do a scuba dive day. Maria has a mild peanut allergy - important to communicate at restaurants. Shared expenses tracker set up in Splitwise. Everyone arrives on different flights within 2 hours of each other. Meeting at the villa at 10 AM.',
    createdAt: '2026-05-12T19:15:00Z',
  },

  // New York notes (trip-4)
  {
    id: 'note-9',
    tripId: 'trip-4',
    title: 'Broadway Show Recap',
    content: 'Saw Hamilton - absolutely incredible. Kids were mesmerized. Orchestra seats row F were worth the premium. Got them through the lottery 2 weeks before. Also queued for same-day Hamilton tickets at the box office but they sold out in 10 minutes. Next time, book further in advance.',
    createdAt: '2026-03-14T22:00:00Z',
  },
  {
    id: 'note-10',
    tripId: 'trip-4',
    title: 'Food Hit List Results',
    content: 'Peter Luger was worth the trip to Brooklyn - get the porterhouse for two. Joe\'s Pizza is the best slice in the city, better than the over-rated places near Times Square. Russ & Daughters appetizing shop is a must for breakfast/brunch - the smoked salmon platter is divine. Katz\'s pastrami was also incredible.',
    createdAt: '2026-03-15T20:30:00Z',
  },

  // Costa Rica notes (trip-5)
  {
    id: 'note-11',
    tripId: 'trip-5',
    title: 'Volcano Hike Research',
    content: 'Arenal Volcano hike is the most popular option. The 1968 Trail is moderate difficulty and takes about 3 hours. Best to go early morning (7 AM) before clouds obscure the peak. Guide recommended: Arenal 1968 tour company, $45 per person. They also offer a combo with hot springs in the evening for $75 total.',
    createdAt: '2026-04-28T10:00:00Z',
  },
  {
    id: 'note-12',
    tripId: 'trip-5',
    title: 'Surf Spots for Beginners',
    content: 'Best beginner surf spots: Tamarindo (sandy bottom, gentle waves, tons of schools), Playa Guiones in Nosara (consistent waves, laid-back vibe), and Jaco (closest to San Jose but can get crowded). Tamarindo seems like the best fit for us. Group lessons are about $60 for 2 hours including board rental.',
    createdAt: '2026-05-03T14:45:00Z',
  },
];

export const checklistItems: ChecklistItem[] = [
  // Tokyo packing (trip-1)
  { id: 'cl-1', tripId: 'trip-1', text: 'Lightweight breathable shirts (x5)', checked: false, category: 'packing' },
  { id: 'cl-2', tripId: 'trip-1', text: 'Comfortable walking shoes', checked: false, category: 'packing' },
  { id: 'cl-3', tripId: 'trip-1', text: 'Portable fan / cooling towel', checked: true, category: 'packing' },
  { id: 'cl-4', tripId: 'trip-1', text: 'Light rain jacket (July is rainy season)', checked: false, category: 'packing' },
  { id: 'cl-5', tripId: 'trip-1', text: 'Universal power adapter (Type A)', checked: true, category: 'packing' },
  { id: 'cl-6', tripId: 'trip-1', text: 'Sunscreen SPF 50+', checked: false, category: 'packing' },
  // Tokyo documents
  { id: 'cl-7', tripId: 'trip-1', text: 'Passport (valid 6+ months)', checked: true, category: 'documents' },
  { id: 'cl-8', tripId: 'trip-1', text: 'JR Pass voucher', checked: false, category: 'documents' },
  { id: 'cl-9', tripId: 'trip-1', text: 'Travel insurance confirmation', checked: true, category: 'documents' },
  { id: 'cl-10', tripId: 'trip-1', text: 'Hotel reservation printouts', checked: false, category: 'documents' },
  // Tokyo reminders
  { id: 'cl-11', tripId: 'trip-1', text: 'Order Japanese Yen from bank', checked: false, category: 'reminders' },
  { id: 'cl-12', tripId: 'trip-1', text: 'Download offline maps for Tokyo', checked: true, category: 'reminders' },
  { id: 'cl-13', tripId: 'trip-1', text: 'Book airport transfer return', checked: false, category: 'reminders' },

  // Paris packing (trip-2)
  { id: 'cl-14', tripId: 'trip-2', text: 'Elegant dinner outfit (for Le Cinq)', checked: true, category: 'packing' },
  { id: 'cl-15', tripId: 'trip-2', text: 'Comfortable flats (lots of cobblestone)', checked: true, category: 'packing' },
  { id: 'cl-16', tripId: 'trip-2', text: 'Light scarf or wrap (evenings can be cool)', checked: false, category: 'packing' },
  { id: 'cl-17', tripId: 'trip-2', text: 'Day bag for museum visits', checked: true, category: 'packing' },
  { id: 'cl-18', tripId: 'trip-2', text: 'Sunglasses', checked: false, category: 'packing' },
  // Paris documents
  { id: 'cl-19', tripId: 'trip-2', text: 'Passport', checked: true, category: 'documents' },
  { id: 'cl-20', tripId: 'trip-2', text: 'Dinner reservation confirmations', checked: true, category: 'documents' },
  { id: 'cl-21', tripId: 'trip-2', text: 'Eiffel Tower summit tickets', checked: true, category: 'documents' },
  { id: 'cl-22', tripId: 'trip-2', text: 'Travel insurance card', checked: true, category: 'documents' },
  // Paris reminders
  { id: 'cl-23', tripId: 'trip-2', text: 'Notify credit card of international travel', checked: true, category: 'reminders' },
  { id: 'cl-24', tripId: 'trip-2', text: 'Download offline French phrases', checked: false, category: 'reminders' },

  // Bali packing (trip-3)
  { id: 'cl-25', tripId: 'trip-3', text: 'Reef-safe sunscreen', checked: false, category: 'packing' },
  { id: 'cl-26', tripId: 'trip-3', text: 'Snorkel gear (or rent there)', checked: true, category: 'packing' },
  { id: 'cl-27', tripId: 'trip-3', text: 'Modest temple clothing (sarong/shawl)', checked: false, category: 'packing' },
  { id: 'cl-28', tripId: 'trip-3', text: 'Insect repellent (DEET)', checked: false, category: 'packing' },
  { id: 'cl-29', tripId: 'trip-3', text: 'Waterproof phone case', checked: true, category: 'packing' },
  { id: 'cl-30', tripId: 'trip-3', text: 'Flip flops and hiking sandals', checked: false, category: 'packing' },
  // Bali documents
  { id: 'cl-31', tripId: 'trip-3', text: 'Passport (6+ months validity)', checked: true, category: 'documents' },
  { id: 'cl-32', tripId: 'trip-3', text: 'Visa on arrival fee (500k IDR cash)', checked: false, category: 'documents' },
  { id: 'cl-33', tripId: 'trip-3', text: 'Villa booking confirmation', checked: true, category: 'documents' },
  // Bali reminders
  { id: 'cl-34', tripId: 'trip-3', text: 'Check malaria requirements with doctor', checked: true, category: 'reminders' },
  { id: 'cl-35', tripId: 'trip-3', text: 'Arrange split of shared costs with group', checked: false, category: 'reminders' },
  { id: 'cl-36', tripId: 'trip-3', text: 'Download Grab app for transport', checked: true, category: 'reminders' },

  // New York packing (trip-4)
  { id: 'cl-37', tripId: 'trip-4', text: 'Warm jacket (March is chilly)', checked: true, category: 'packing' },
  { id: 'cl-38', tripId: 'trip-4', text: 'Comfortable walking shoes', checked: true, category: 'packing' },
  { id: 'cl-39', tripId: 'trip-4', text: 'Kids entertainment for flight', checked: true, category: 'packing' },
  { id: 'cl-40', tripId: 'trip-4', text: 'Portable charger', checked: true, category: 'packing' },
  { id: 'cl-41', tripId: 'trip-4', text: 'Umbrella', checked: true, category: 'packing' },
  // New York documents
  { id: 'cl-42', tripId: 'trip-4', text: 'Broadway tickets (digital)', checked: true, category: 'documents' },
  { id: 'cl-43', tripId: 'trip-4', text: 'Hotel confirmation', checked: true, category: 'documents' },
  { id: 'cl-44', tripId: 'trip-4', text: 'Museum tickets', checked: true, category: 'documents' },
  // New York reminders
  { id: 'cl-45', tripId: 'trip-4', text: 'Pre-book restaurant reservations', checked: true, category: 'reminders' },
  { id: 'cl-46', tripId: 'trip-4', text: 'Check subway map for weekend service changes', checked: true, category: 'reminders' },

  // Costa Rica packing (trip-5)
  { id: 'cl-47', tripId: 'trip-5', text: 'Quick-dry hiking clothes', checked: false, category: 'packing' },
  { id: 'cl-48', tripId: 'trip-5', text: 'Hiking boots with good grip', checked: false, category: 'packing' },
  { id: 'cl-49', tripId: 'trip-5', text: 'Dry bag for rafting', checked: false, category: 'packing' },
  { id: 'cl-50', tripId: 'trip-5', text: 'Binoculars for wildlife', checked: false, category: 'packing' },
  { id: 'cl-51', tripId: 'trip-5', text: 'Bug spray and after-bite', checked: false, category: 'packing' },
  { id: 'cl-52', tripId: 'trip-5', text: 'Swimwear for hot springs', checked: false, category: 'packing' },
  // Costa Rica documents
  { id: 'cl-53', tripId: 'trip-5', text: 'Passport', checked: false, category: 'documents' },
  { id: 'cl-54', tripId: 'trip-5', text: 'Yellow fever vaccination certificate (if coming from affected country)', checked: false, category: 'documents' },
  { id: 'cl-55', tripId: 'trip-5', text: 'Rental car reservation', checked: false, category: 'documents' },
  // Costa Rica reminders
  { id: 'cl-56', tripId: 'trip-5', text: 'Book zip-lining tour in advance', checked: false, category: 'reminders' },
  { id: 'cl-57', tripId: 'trip-5', text: 'Research white water rafting Class III options', checked: true, category: 'reminders' },
  { id: 'cl-58', tripId: 'trip-5', text: 'Check if we need a 4x4 rental for La Fortuna roads', checked: false, category: 'reminders' },
];

export const getNotesByTripId = (tripId: string): Note[] =>
  notes.filter(n => n.tripId === tripId);

export const getChecklistByTripId = (tripId: string): ChecklistItem[] =>
  checklistItems.filter(c => c.tripId === tripId);

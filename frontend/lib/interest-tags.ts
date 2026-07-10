// Single source of truth for the fixed interest-tag vocabulary used by both
// the onboarding chip picker and the settings interest editor. Keeping one
// list means the two surfaces can never drift into different tag sets again
// (see PROJECT_REVIEW.md P1-3 — that's exactly how interest_tags/interests
// ended up split in the first place).

export interface InterestTagOption {
  tag: string;
  label: string;
  photo: string;
}

export interface InterestTagRow {
  label: string;
  cards: InterestTagOption[];
}

export const INTEREST_TAG_ROWS: InterestTagRow[] = [
  {
    label: "OUTDOORS & NATURE",
    cards: [
      { tag: "treks_cleanups", label: "Treks & Cleanups", photo: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=600&fit=crop" },
      { tag: "tree_plantation", label: "Tree Plantation", photo: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=600&fit=crop" },
      { tag: "water_cleanup", label: "River & Lake Cleanups", photo: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=600&fit=crop" },
      { tag: "wildlife", label: "Wildlife & Conservation", photo: "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400&h=600&fit=crop" },
      { tag: "urban_gardening", label: "Urban Gardening", photo: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=600&fit=crop" },
    ],
  },
  {
    label: "PEOPLE & COMMUNITY",
    cards: [
      { tag: "food_drives", label: "Feed the City", photo: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=600&fit=crop" },
      { tag: "donation_drives", label: "Clothes & Blanket Drives", photo: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=600&fit=crop" },
      { tag: "elderly_care", label: "Chai with Elders", photo: "https://images.unsplash.com/photo-1566765343500-b1cac4b4b508?w=400&h=600&fit=crop" },
      { tag: "women_safety", label: "Women & Safety", photo: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=400&h=600&fit=crop" },
      { tag: "slum_upliftment", label: "Slum & Upliftment", photo: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=600&fit=crop" },
    ],
  },
  {
    label: "KIDS & LEARNING",
    cards: [
      { tag: "teaching", label: "Teach & Mentor", photo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=600&fit=crop" },
      { tag: "kids_art", label: "Art & Craft with Kids", photo: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=600&fit=crop" },
      { tag: "kids_sports", label: "Sports & Play Days", photo: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=400&h=600&fit=crop" },
      { tag: "storytelling", label: "Storytelling & Reading", photo: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop" },
      { tag: "career_guidance", label: "Career Guidance", photo: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=600&fit=crop" },
    ],
  },
  {
    label: "ANIMALS & RESCUE",
    cards: [
      { tag: "dog_feeding", label: "Street Dog Feeding", photo: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=600&fit=crop" },
      { tag: "animal_shelter", label: "Shelter Volunteering", photo: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=600&fit=crop" },
      { tag: "adoption_drives", label: "Adoption & Rescue Drives", photo: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=600&fit=crop" },
      { tag: "cat_care", label: "Cat Care & Feeding", photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=600&fit=crop" },
      { tag: "bird_rescue", label: "Bird & Wildlife Rescue", photo: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&h=600&fit=crop" },
    ],
  },
  {
    label: "CULTURE, HEALTH & ACTION",
    cards: [
      { tag: "art_culture", label: "Art, Murals & Heritage", photo: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=600&fit=crop" },
      { tag: "health_camps", label: "Blood Donation & Health Camps", photo: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=600&fit=crop" },
      { tag: "marathons_sports", label: "Marathons & Sports Events", photo: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=400&h=600&fit=crop" },
      { tag: "mental_health", label: "Mental Health & Wellness", photo: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=600&fit=crop" },
      { tag: "rallies_awareness", label: "Rallies & Awareness", photo: "https://images.unsplash.com/photo-1591184510259-5b63e0a24de4?w=400&h=600&fit=crop" },
    ],
  },
];

export const INTEREST_TAG_OPTIONS: InterestTagOption[] = INTEREST_TAG_ROWS.flatMap((row) => row.cards);

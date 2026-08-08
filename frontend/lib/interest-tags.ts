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
      { tag: "treks_cleanups", label: "Treks & Cleanups", photo: "/onboarding/treks_cleanups.jpg" },
      { tag: "tree_plantation", label: "Tree Plantation", photo: "/onboarding/tree_plantation.jpg" },
      { tag: "water_cleanup", label: "River & Lake Cleanups", photo: "/onboarding/water_cleanup.jpg" },
      { tag: "wildlife", label: "Wildlife & Conservation", photo: "/onboarding/wildlife.jpg" },
      { tag: "urban_gardening", label: "Urban Gardening", photo: "/onboarding/urban_gardening.jpg" },
    ],
  },
  {
    label: "PEOPLE & COMMUNITY",
    cards: [
      { tag: "food_drives", label: "Feed the City", photo: "/onboarding/food_drives.jpg" },
      { tag: "donation_drives", label: "Clothes & Blanket Drives", photo: "/onboarding/donation_drives.jpg" },
      { tag: "elderly_care", label: "Chai with Elders", photo: "/onboarding/elderly_care.jpg" },
      { tag: "women_safety", label: "Women & Safety", photo: "/onboarding/women_safety.jpg" },
      { tag: "slum_upliftment", label: "Slum & Upliftment", photo: "/onboarding/slum_upliftment.jpg" },
    ],
  },
  {
    label: "KIDS & LEARNING",
    cards: [
      { tag: "teaching", label: "Teach & Mentor", photo: "/onboarding/teaching.jpg" },
      { tag: "kids_art", label: "Art & Craft with Kids", photo: "/onboarding/kids_art.jpg" },
      { tag: "kids_sports", label: "Sports & Play Days", photo: "/onboarding/kids_sports.jpg" },
      { tag: "storytelling", label: "Storytelling & Reading", photo: "/onboarding/storytelling.jpg" },
      { tag: "career_guidance", label: "Career Guidance", photo: "/onboarding/career_guidance.jpg" },
    ],
  },
  {
    label: "ANIMALS & RESCUE",
    cards: [
      { tag: "dog_feeding", label: "Street Dog Feeding", photo: "/onboarding/dog_feeding.jpg" },
      { tag: "animal_shelter", label: "Shelter Volunteering", photo: "/onboarding/animal_shelter.jpg" },
      { tag: "adoption_drives", label: "Adoption & Rescue Drives", photo: "/onboarding/adoption_drives.jpg" },
      { tag: "cat_care", label: "Cat Care & Feeding", photo: "/onboarding/cat_care.jpg" },
      { tag: "bird_rescue", label: "Bird & Wildlife Rescue", photo: "/onboarding/bird_rescue.jpg" },
    ],
  },
  {
    label: "CULTURE, HEALTH & ACTION",
    cards: [
      { tag: "art_culture", label: "Art, Murals & Heritage", photo: "/onboarding/art_culture.jpg" },
      { tag: "health_camps", label: "Blood Donation & Health Camps", photo: "/onboarding/health_camps.jpg" },
      { tag: "marathons_sports", label: "Marathons & Sports Events", photo: "/onboarding/marathons_sports.jpg" },
      { tag: "mental_health", label: "Mental Health & Wellness", photo: "/onboarding/mental_health.jpg" },
      { tag: "rallies_awareness", label: "Rallies & Awareness", photo: "/onboarding/rallies_awareness.jpg" },
    ],
  },
];

export const INTEREST_TAG_OPTIONS: InterestTagOption[] = INTEREST_TAG_ROWS.flatMap((row) => row.cards);

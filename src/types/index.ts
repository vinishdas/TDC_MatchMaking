export type Gender = 'Male' | 'Female' | 'Other';
export type StatusTag = 'Active Search' | 'Pending Match' | 'Matched';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  profileImageUrl?: string;
  country: string;
  city: string;
  height: string;
  heightCm: number;
  email: string;
  phoneNumber: string;
  
  // Professional
  undergraduateCollege: string;
  degree: string;
  income: number;
  currentCompany: string;
  designation: string;
  
  // Sociocultural & Personal
  maritalStatus: string;
  languagesKnown: string[];
  siblings: number;
  religion: string;
  caste: string;
  motherTongue?: string;
  familyBackground?: 'Joint' | 'Nuclear' | 'Other';
  dietaryPreferences?: 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Eggetarian';
  smokingHabits?: 'Non-Smoker' | 'Occasional' | 'Regular';
  drinkingHabits?: 'Non-Drinker' | 'Social' | 'Regular';
  
  // Astrological
  birthTime?: string;
  birthPlace?: string;
  manglikStatus?: string;
  gotra?: string;
  
  // Preferences
  wantKids: 'Yes' | 'No' | 'Maybe';
  openToRelocate: 'Yes' | 'No' | 'Maybe';
  openToPets: 'Yes' | 'No' | 'Maybe';
  lifestylePreferences?: string;
  familyValues?: string;
  partnerPreferences?: string;

  // App Metadata
  statusTag: StatusTag;
  notes?: string[];
  matchedWithId?: string;
  suggestedMatches?: SuggestedMatch[];
}

export interface MatchScore {
  score: number; // 0 to 100
  reasoning: string;
  label: string; // e.g. "High Potential Match", "Strong Compatibility"
  isAI: boolean;
}

export interface SuggestedMatch {
  profile: Customer;
  matchScore: MatchScore;
}

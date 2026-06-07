import { Customer, SuggestedMatch, MatchScore } from '@/types';
import { getCustomers } from './dataRepository';

export async function findMatchesForCustomer(customer: Customer): Promise<SuggestedMatch[]> {
  const allCustomers = await getCustomers();
  
  // Phase 1: Hard Filters (Dealbreakers)
  const candidatePool = allCustomers.filter(potential => {
    if (potential.id === customer.id) return false;
    if (potential.statusTag === 'Matched') return false; // Ignore already matched
    if (potential.gender === customer.gender) return false; // Heterosexual matching for MVP
    
    const ageDiff = potential.age - customer.age;
    
    // Strict age gap rule: Cannot be more than 10 years apart in either direction
    if (Math.abs(ageDiff) > 10) return false;
    
    if (customer.gender === 'Male') {
      // For male customers: Match with women who are younger or same age.
      if (potential.age > customer.age) return false;
      // Prefer women with lower income levels (hard filter to exclude drastically higher)
      if (potential.income > customer.income * 1.5) return false;
      // Prefer women who are shorter
      if (potential.heightCm > customer.heightCm) return false;
    } else if (customer.gender === 'Female') {
      // For female customers: generally prefer men who are same age or older
      if (potential.age < customer.age - 2) return false;
    }

    // Strict dealbreaker on kids compatibility
    if (customer.wantKids === 'Yes' && potential.wantKids === 'No') return false;
    if (customer.wantKids === 'No' && potential.wantKids === 'Yes') return false;

    // Strict Location Filter
    // If neither is explicitly open to relocate, they must be in the same city.
    if (customer.openToRelocate !== 'Yes' && potential.openToRelocate !== 'Yes') {
      if (customer.city !== potential.city) return false;
    }

    // Strict Religion Filter
    if (customer.religion && customer.religion !== 'Unknown' && customer.religion !== 'Any') {
      if (potential.religion && potential.religion !== 'Unknown' && potential.religion !== 'Any') {
        if (customer.religion !== potential.religion) return false;
      }
    }

    // Non-Negotiable dietary (if specifically requested, e.g. Vegetarian/Vegan should not match with Non-Veg)
    if (customer.dietaryPreferences === 'Vegetarian' || customer.dietaryPreferences === 'Vegan') {
      if (potential.dietaryPreferences === 'Non-Vegetarian') return false;
    }

    return true;
  });

  // Phase 2: Weighted Trait Scoring
  const scoredMatches: SuggestedMatch[] = candidatePool.map(potential => {
    return {
      profile: potential,
      matchScore: calculateWeightedScore(customer, potential)
    };
  });

  // Phase 3: Sort by score and return Top 5 for AI processing
  scoredMatches.sort((a, b) => b.matchScore.score - a.matchScore.score);
  
  return scoredMatches.slice(0, 5);
}

function calculateWeightedScore(c1: Customer, c2: Customer): MatchScore {
  let score = 50; // Base score
  let reasoningFactors: string[] = [];
  
  // Demographics & Location
  if (c1.city === c2.city) {
    score += 15;
    reasoningFactors.push(`Same city`);
  } else if (c1.openToRelocate === 'Yes' || c2.openToRelocate === 'Yes') {
    score += 10;
    reasoningFactors.push(`Open to relocation`);
  }

  // Religion / Culture
  if (c1.religion === c2.religion && c1.religion !== 'Unknown') {
    score += 15;
    reasoningFactors.push(`Shared religion`);
    if (c1.caste && c2.caste && c1.caste === c2.caste && c1.caste !== 'Unknown') {
      score += 10;
      reasoningFactors.push(`Shared caste`);
    }
  }

  // Dietary & Lifestyle
  if (c1.dietaryPreferences === c2.dietaryPreferences && c1.dietaryPreferences) {
    score += 10;
    reasoningFactors.push(`Matching dietary preferences`);
  }
  if (c1.smokingHabits === c2.smokingHabits) {
    score += 5;
  }
  if (c1.drinkingHabits === c2.drinkingHabits) {
    score += 5;
  }

  // Male-specific preferences scoring
  if (c1.gender === 'Male') {
    if (c2.age < c1.age) score += 5;
    if (c2.income < c1.income) score += 5;
    if (c2.heightCm < c1.heightCm) score += 5;
  }

  // Female-specific holistic compatibility scoring
  if (c1.gender === 'Female') {
    if (c2.income >= c1.income) {
      score += 10;
      reasoningFactors.push(`Professional parity`);
    }
    if (c1.familyBackground === c2.familyBackground) {
      score += 5;
      reasoningFactors.push(`Similar family background`);
    }
  }

  // Cap score
  score = Math.min(Math.round(score), 95);
  
  let label = 'Good Match';
  if (score >= 85) label = 'Strong Compatibility';
  if (score >= 90) label = 'High Potential Match';

  const reasoning = reasoningFactors.length > 0 
    ? `Matches based on: ${reasoningFactors.slice(0, 3).join(', ')}.`
    : `Baseline demographic match.`;

  return {
    score,
    label,
    reasoning,
    isAI: false
  };
}

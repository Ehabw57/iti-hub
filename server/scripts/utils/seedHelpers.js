/**
 * Seed Utilities - Helper functions for realistic data generation
 */

const { 
  SEED_PROFILE_PICTURES, 
  SEED_COVER_IMAGES, 
  SEED_POST_IMAGES,
  SEED_COMMUNITY_IMAGES 
} = require('../../utils/constants');

/**
 * Get a random item from an array
 */
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get multiple random items from an array (no duplicates)
 */
function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Get random number between min and max (inclusive)
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random boolean with given probability (0-1)
 */
function getRandomBoolean(probability = 0.5) {
  return Math.random() < probability;
}

/**
 * Generate a random date within the last N days
 * More recent dates are more likely (exponential distribution)
 */
function getRandomDateInLastDays(days, biasRecent = true) {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const maxMs = days * msPerDay;
  
  let randomMs;
  if (biasRecent) {
    // Exponential distribution - more recent dates more likely
    const x = Math.random();
    randomMs = maxMs * Math.pow(x, 2); // Quadratic bias towards recent
  } else {
    randomMs = Math.random() * maxMs;
  }
  
  return new Date(now.getTime() - randomMs);
}

/**
 * Generate a random date between minDays and maxDays ago
 */
function getRandomDate(minDays, maxDays) {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const minMs = minDays * msPerDay;
  const maxMs = maxDays * msPerDay;
  const randomMs = minMs + Math.random() * (maxMs - minMs);
  return new Date(now.getTime() - randomMs);
}

/**
 * Generate a date after a given date (within minHours to maxHours)
 */
function getRandomDateAfter(date, minHours = 0.5, maxHours = 24) {
  const msPerHour = 60 * 60 * 1000;
  const minMs = minHours * msPerHour;
  const maxMs = maxHours * msPerHour;
  const randomMs = minMs + Math.random() * (maxMs - minMs);
  const result = new Date(date.getTime() + randomMs);
  // Don't return future dates
  return result > new Date() ? new Date() : result;
}

/**
 * Generate a random date between two dates
 */
function getRandomDateBetween(startDate, endDate) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

/**
 * Generate a date after a given date (within maxMinutes)
 */
function getDateAfter(date, minMinutes = 5, maxMinutes = 120) {
  const ms = getRandomInt(minMinutes * 60 * 1000, maxMinutes * 60 * 1000);
  return new Date(date.getTime() + ms);
}

/**
 * Generate a date slightly after another (for replies/comments)
 */
function getConversationalDate(parentDate, minMinutes = 1, maxMinutes = 30) {
  return getDateAfter(parentDate, minMinutes, maxMinutes);
}

/**
 * Weighted random selection from array of { value, weight } objects
 */
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item.value;
  }
  
  return items[items.length - 1].value;
}

/**
 * Format user number with leading zeros (user001, user002, etc.)
 */
function formatUserNumber(num, digits = 3) {
  return String(num).padStart(digits, '0');
}

/**
 * Generate username from name
 */
function generateUsername(firstName, lastName, number) {
  const base = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
  return number ? `${base}${formatUserNumber(number)}` : base;
}

/**
 * Generate email from pattern
 */
function generateEmail(prefix, number) {
  return `${prefix}${formatUserNumber(number)}@example.com`;
}

/**
 * Get random profile picture
 */
function getRandomProfilePicture() {
  return getRandomItem(SEED_PROFILE_PICTURES);
}

/**
 * Get random cover image
 */
function getRandomCoverImage() {
  return getRandomItem(SEED_COVER_IMAGES);
}

/**
 * Get random post images (0-3 images with decreasing probability)
 */
function getRandomPostImages() {
  // 70% chance of no images, 20% chance of 1, 7% chance of 2, 3% chance of 3
  const roll = Math.random();
  if (roll > 0.3) return [];
  if (roll > 0.1) return [getRandomItem(SEED_POST_IMAGES)];
  if (roll > 0.03) return getRandomItems(SEED_POST_IMAGES, 2);
  return getRandomItems(SEED_POST_IMAGES, 3);
}

/**
 * Get random community image
 */
function getRandomCommunityImage() {
  return getRandomItem(SEED_COMMUNITY_IMAGES);
}

/**
 * Shuffle array in place (Fisher-Yates)
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Create a weighted random selector
 * Higher weight = higher probability
 */
function weightedRandomSelect(items, weights) {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  
  return items[items.length - 1];
}

/**
 * Get power users (first N users with high activity)
 */
function getPowerUsers(users, count = 5) {
  return users.slice(0, count);
}

/**
 * Get regular users (moderate activity)
 */
function getRegularUsers(users, startIndex = 5, count = 15) {
  return users.slice(startIndex, startIndex + count);
}

/**
 * Get casual users (low activity)
 */
function getCasualUsers(users, startIndex = 20) {
  return users.slice(startIndex);
}

/**
 * Select random users with realistic distribution
 * Power users are selected more often
 */
function selectRandomUsers(users, count, excludeIds = []) {
  const availableUsers = users.filter(u => !excludeIds.includes(u._id.toString()));
  
  // Weight distribution: power users (5) get 3x weight, regular (15) get 2x, casual get 1x
  const weights = availableUsers.map((_, index) => {
    if (index < 5) return 3;
    if (index < 20) return 2;
    return 1;
  });
  
  const selected = [];
  const usedIndices = new Set();
  
  while (selected.length < count && usedIndices.size < availableUsers.length) {
    const totalWeight = weights.reduce((sum, w, i) => usedIndices.has(i) ? sum : sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < availableUsers.length; i++) {
      if (usedIndices.has(i)) continue;
      random -= weights[i];
      if (random <= 0) {
        selected.push(availableUsers[i]);
        usedIndices.add(i);
        break;
      }
    }
  }
  
  return selected;
}

/**
 * Generate realistic interaction counts
 * Returns { likes, comments, saves } based on post "quality"
 */
function generateInteractionCounts() {
  const quality = Math.random(); // 0-1 representing post quality/virality
  
  if (quality > 0.95) {
    // Viral post (5%)
    return {
      likes: getRandomInt(50, 150),
      comments: getRandomInt(20, 50),
      saves: getRandomInt(10, 30)
    };
  } else if (quality > 0.8) {
    // Popular post (15%)
    return {
      likes: getRandomInt(20, 50),
      comments: getRandomInt(8, 20),
      saves: getRandomInt(5, 15)
    };
  } else if (quality > 0.5) {
    // Average post (30%)
    return {
      likes: getRandomInt(5, 20),
      comments: getRandomInt(2, 8),
      saves: getRandomInt(1, 5)
    };
  } else {
    // Low engagement post (50%)
    return {
      likes: getRandomInt(0, 5),
      comments: getRandomInt(0, 3),
      saves: getRandomInt(0, 2)
    };
  }
}

/**
 * Create index map for quick lookups
 */
function createIndexMap(items, keyField = '_id') {
  return new Map(items.map((item, index) => [item[keyField].toString(), index]));
}

/**
 * Log progress for long operations
 */
function logProgress(current, total, label) {
  const percent = Math.round((current / total) * 100);
  if (current % 10 === 0 || current === total) {
    console.log(`   ${label}: ${current}/${total} (${percent}%)`);
  }
}

module.exports = {
  getRandomItem,
  getRandomItems,
  getRandomInt,
  getRandomBoolean,
  getRandomDateInLastDays,
  getRandomDate,
  getRandomDateAfter,
  getRandomDateBetween,
  getDateAfter,
  getConversationalDate,
  weightedRandom,
  formatUserNumber,
  generateUsername,
  generateEmail,
  getRandomProfilePicture,
  getRandomCoverImage,
  getRandomPostImages,
  getRandomCommunityImage,
  shuffleArray,
  weightedRandomSelect,
  getPowerUsers,
  getRegularUsers,
  getCasualUsers,
  selectRandomUsers,
  generateInteractionCounts,
  createIndexMap,
  logProgress
};

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function hashSeed(seed: string): number {
  return seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

// Generate a random-looking segment from seed + index
function generateSegment(seed: string, index: number): string {
  let segment = "";
  for (let i = 0; i < 4; i++) {
    const charIndex = (seed.charCodeAt((i + index) % seed.length) + index * 17 + i * 11) % CHARS.length;
    segment += CHARS[charIndex];
  }
  return segment;
}

// Generate a date-encoded segment like '1304' → encoded with chars
function encodeDateSegment(dateCode: string): string {
  let result = "";
  for (let i = 0; i < 4; i++) {
    const digit = parseInt(dateCode[i]);
    result += CHARS[(digit * 13 + i * 3) % CHARS.length];
  }
  return result;
}

// Decode back from encoded to '1304'
function decodeDateSegment(encoded: string): string {
  let result = "";
  for (let i = 0; i < 4; i++) {
    const index = CHARS.indexOf(encoded[i]);
    let digit = Math.round((index - i * 3) / 13);
    if (digit < 0 || digit > 9) return ""; // invalid
    result += digit.toString();
  }
  return result;
}

// Create consistent key from date
export function generateCanonicalKeyFromDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dateCode = `${day}${month}`;
  const seed = `${day}${month}${date.getFullYear()}`;

  const hash = hashSeed(seed);
  const dateSegmentIndex = hash % 4; // random but consistent index between 0–3
  const segments: string[] = [];

  for (let i = 0; i < 4; i++) {
    if (i === dateSegmentIndex) {
      segments.push(encodeDateSegment(dateCode));
    } else {
      segments.push(generateSegment(seed, i));
    }
  }

  return segments.join("-");
}

// Extract date from any of the 4 segments
export function extractDateFromKey(key: string): Date | null {
  const parts = key.split("-");
  if (parts.length !== 4) return null;

  for (const segment of parts) {
    const decoded = decodeDateSegment(segment);
    if (decoded.length === 4) {
      const day = parseInt(decoded.slice(0, 2));
      const month = parseInt(decoded.slice(2, 4));
      const year = new Date().getFullYear();
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return new Date(year, month - 1, day);
      }
    }
  }

  return null;
}

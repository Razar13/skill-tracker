import catalogImages from "./skill-catalog-images.json" with { type: "json" };

export function getCatalogImage(name: string): string | null {
  return (catalogImages as Record<string, string | null>)[name] ?? null;
}

export interface CatalogSkillBase {
  name: string;
  description: string;
}

export interface CatalogSkill extends CatalogSkillBase {
  category: string;
}

export interface SkillCategory {
  category: string;
  skills: CatalogSkillBase[];
}

// Max 10 skills per category for now — easy to extend later,
// and a good place to introduce sub-categories down the line.
export const SKILL_CATALOG: SkillCategory[] = [
  {
    category: "Music",
    skills: [
      { name: "Guitar", description: "Chords, scales, fingerstyle, and repertoire development." },
      { name: "Piano", description: "Sight reading, scales, classical, jazz, and synth play." },
      { name: "Vocals", description: "Breath control, interval leaps, chest voice projection." },
      { name: "Drums", description: "Rhythm study, hand independence, time keeping." },
      { name: "Bass Guitar", description: "Groove, walking lines, and low-end technique." },
      { name: "Violin", description: "Bowing technique, intonation, and vibrato." },
      { name: "Ukulele", description: "Chord shapes, strumming patterns, and fingerpicking." },
      { name: "Music Theory", description: "Harmony, scales, and composition fundamentals." },
      { name: "Saxophone", description: "Embouchure, tone, and improvisation." },
      { name: "Cello", description: "Bow control, shifting, and repertoire." },
    ],
  },
  {
    category: "Languages",
    skills: [
      { name: "English", description: "Vocabulary, grammar, and conversational fluency." },
      { name: "Spanish", description: "Grammar, vocabulary, and everyday conversation." },
      { name: "French", description: "Pronunciation, grammar, and vocabulary building." },
      { name: "German", description: "Grammar structure, cases, and vocabulary." },
      { name: "Japanese", description: "Hiragana, katakana, kanji, and conversation." },
      { name: "Mandarin", description: "Tones, characters, and conversational practice." },
      { name: "Korean", description: "Hangul, grammar, and vocabulary building." },
      { name: "Italian", description: "Pronunciation, grammar, and vocabulary." },
      { name: "Portuguese", description: "Grammar, vocabulary, and conversation practice." },
      { name: "Arabic", description: "Script, grammar, and conversational basics." },
    ],
  },
  {
    category: "Programming",
    skills: [
      { name: "Web Development", description: "HTML, CSS, JavaScript, and modern frameworks." },
      { name: "Python", description: "Syntax, scripting, and problem solving." },
      { name: "JavaScript", description: "Core language features and browser APIs." },
      { name: "Data Structures & Algorithms", description: "Problem solving and interview prep." },
      { name: "Machine Learning", description: "Models, data pipelines, and evaluation." },
      { name: "Mobile Development", description: "Building iOS and Android apps." },
      { name: "Game Development", description: "Engines, game loops, and design patterns." },
      { name: "DevOps", description: "CI/CD, containers, and infrastructure." },
      { name: "SQL", description: "Queries, joins, and database design." },
      { name: "Cybersecurity", description: "Threats, defenses, and secure coding." },
    ],
  },
  {
    category: "Sports & Fitness",
    skills: [
      { name: "Running", description: "Pacing, endurance, and race training." },
      { name: "Swimming", description: "Stroke technique and endurance." },
      { name: "Yoga", description: "Flexibility, breathing, and mindfulness." },
      { name: "Weightlifting", description: "Strength training and form." },
      { name: "Basketball", description: "Ball handling, shooting, and game sense." },
      { name: "Football", description: "Dribbling, passing, and tactical awareness." },
      { name: "Volleyball", description: "Serving, spiking, and team strategy." },
      { name: "Tennis", description: "Strokes, footwork, and match play." },
      { name: "Boxing", description: "Footwork, combinations, and conditioning." },
      { name: "Cycling", description: "Endurance, technique, and route training." },
      { name: "Rock Climbing", description: "Technique, grip strength, and route reading." },
      { name: "Martial Arts", description: "Forms, sparring, and discipline." },
    ],
  },
  {
    category: "Art & Design",
    skills: [
      { name: "Drawing", description: "Line, shading, and perspective fundamentals." },
      { name: "Painting", description: "Color theory, composition, and technique." },
      { name: "Photography", description: "Composition, lighting, and editing." },
      { name: "Graphic Design", description: "Layout, typography, and branding." },
      { name: "Animation", description: "Motion, timing, and storytelling." },
      { name: "Sculpture", description: "Form, material, and technique." },
      { name: "UI/UX Design", description: "Wireframes, prototypes, and usability." },
      { name: "Calligraphy", description: "Lettering styles and pen control." },
      { name: "Digital Illustration", description: "Digital tools and illustration technique." },
      { name: "Video Editing", description: "Cutting, pacing, and post-production." },
    ],
  },
  {
    category: "Other",
    skills: [
      { name: "Public Speaking", description: "Confidence, structure, and delivery." },
      { name: "Chess", description: "Openings, tactics, and endgames." },
      { name: "Cooking", description: "Techniques, recipes, and flavor building." },
      { name: "Writing", description: "Style, structure, and storytelling." },
      { name: "Meditation", description: "Focus, breathing, and mindfulness practice." },
    ],
  },
];

// Curated shortlist shown by default before the user searches or picks a category.
export const POPULAR_SKILL_NAMES = [
  "Guitar",
  "Piano",
  "Vocals",
  "Drums",
  "English",
  "Python",
  "Yoga",
  "Photography",
];
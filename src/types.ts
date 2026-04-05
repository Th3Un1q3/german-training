
export type Mode = 'speech' | 'scramble' | 'one-by-one';

export interface Exercise {
  english: string;
  german: string;
  topic: string;
  words: string[]; // German words split
  candidates: string[][]; // For one-by-one mode: [wordIndex][6 candidates]
}

export interface ValidationResult {
  isCorrect: boolean;
  transcription?: string;
  correction: string;
  explanation: string;
  highlightedErrors: { word: string; error: string }[];
}

export interface SessionResult {
  exercise: Exercise;
  validation: ValidationResult;
}

export interface RuleInfo {
  title: string;
  cheatSheet: {
    useCases: string[];
    nuances: string[];
    examples: { de: string; en: string; note: string }[];
  };
  exerciseDesign: {
    focusAreas: string[];
    difficultyProgression: string;
  };
}

export interface SessionConfig {
  topic: string;
  totalExercises: number;
  ruleInfo?: RuleInfo;
}


export type DeterminerType = 'artículo' | 'demostrativo' | 'posesivo' | 'numeral' | 'indefinido';

export interface DeterminerExample {
  word: string;
  type: DeterminerType;
  sentence: string;
  explanation: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  category: DeterminerType | 'general';
}

export interface UserProgress {
  totalPoints: number;
  stats: Record<DeterminerType, { correct: number; total: number }>;
  badges: Badge[];
}

export interface GameState {
  score: number;
  currentLevel: number;
  lives: number;
  phase: 'start' | 'playing' | 'feedback' | 'gameover' | 'won' | 'stats';
}

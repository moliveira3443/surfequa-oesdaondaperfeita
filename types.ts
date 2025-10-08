export interface Equation {
  a: number;
  b: number;
  c: number;
}

export interface Question {
  problemText: string;
  equation1: Equation;
  equation2: Equation;
  variableX: string;
  variableY: string;
}

export type GameState = 'start' | 'loading' | 'playing' | 'feedback' | 'end';
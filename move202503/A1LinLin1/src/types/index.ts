// src/types/index.ts
export interface Finding {
  line: number;
  col: number;
  message: string;
  category?: string;
}


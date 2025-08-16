class WordHistoryEntry {
  word: string;
  added: Date;
}

export class UserHistoryResponseDto {
  results: WordHistoryEntry[];
  totalDocs: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

class WordHistoryEntry {
  word: string;
  added: Date;
}

export class UserListPagination {
  results: WordHistoryEntry[];
  totalDocs: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

import { Test, TestingModule } from '@nestjs/testing';
import { EntriesService } from './entries.service';
import { PrismaService } from '../shared/prisma.service';
import { HttpService } from '@nestjs/axios';
import { NotFoundException } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

describe('EntriesService', () => {
  let service: EntriesService;

  const mockPrismaService = {
    words: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    history: {
      create: jest.fn(),
    },
    favorites: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUserId = 'user-123';
  const mockWordId = 'word-456';

  const mockHistoryEntry = {
    id: 'history-789',
    user_id: mockUserId,
    word_id: mockWordId,
    created_at: new Date('2025-08-16T14:30:00.000Z'),
  };

  const mockFavoriteEntry = {
    id: 'favorite-101',
    user_id: mockUserId,
    word_id: mockWordId,
    created_at: new Date('2025-08-16T14:30:00.000Z'),
  };

  const expectedCreateCall = {
    data: {
      user_id: mockUserId,
      word_id: mockWordId,
    },
  };

  const expectedFindFirstCall = {
    where: {
      user_id: mockUserId,
      word_id: mockWordId,
    },
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockWordDetails = [
    {
      word: 'fire',
    },
  ];

  const mockResponse = {
    data: mockWordDetails,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<EntriesService>(EntriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEntries', () => {
    it('should return entries with pagination', async () => {
      const mockWords = [
        { word: 'fire' },
        { word: 'firefly' },
        { word: 'fireplace' },
      ];

      mockPrismaService.words.findMany.mockResolvedValue(mockWords);
      mockPrismaService.words.count.mockResolvedValue(20);

      const query = {
        search: 'fire',
        page: 1,
        limit: 3,
      };

      const result = await service.getEntries(query);

      expect(result).toEqual({
        results: ['fire', 'firefly', 'fireplace'],
        totalDocs: 20,
        page: 1,
        totalPages: 7,
        hasNext: true,
        hasPrev: false,
      });

      expect(mockPrismaService.words.findMany).toHaveBeenCalledWith({
        where: {
          word: {
            contains: 'fire',
            mode: 'insensitive',
          },
        },
        skip: 0,
        take: 3,
        select: {
          word: true,
        },
      });

      expect(mockPrismaService.words.count).toHaveBeenCalledWith({
        where: {
          word: {
            contains: 'fire',
            mode: 'insensitive',
          },
        },
      });
    });

    it('should handle second page correctly', async () => {
      const mockWords = [{ word: 'fireman' }, { word: 'firewood' }];

      mockPrismaService.words.findMany.mockResolvedValue(mockWords);
      mockPrismaService.words.count.mockResolvedValue(20);

      const query = {
        search: 'fire',
        page: 2,
        limit: 3,
      };

      const result = await service.getEntries(query);

      expect(result).toEqual({
        results: ['fireman', 'firewood'],
        totalDocs: 20,
        page: 2,
        totalPages: 7,
        hasNext: true,
        hasPrev: true,
      });

      expect(mockPrismaService.words.findMany).toHaveBeenCalledWith({
        where: {
          word: {
            contains: 'fire',
            mode: 'insensitive',
          },
        },
        skip: 3,
        take: 3,
        select: {
          word: true,
        },
      });
    });

    it('should handle last page correctly', async () => {
      const mockWords = [{ word: 'firewall' }];

      mockPrismaService.words.findMany.mockResolvedValue(mockWords);
      mockPrismaService.words.count.mockResolvedValue(10);

      const query = {
        search: 'fire',
        page: 4,
        limit: 3,
      };

      const result = await service.getEntries(query);

      expect(result).toEqual({
        results: ['firewall'],
        totalDocs: 10,
        page: 4,
        totalPages: 4,
        hasNext: false,
        hasPrev: true,
      });

      expect(mockPrismaService.words.findMany).toHaveBeenCalledWith({
        where: {
          word: {
            contains: 'fire',
            mode: 'insensitive',
          },
        },
        skip: 9,
        take: 3,
        select: {
          word: true,
        },
      });
    });

    it('should handle empty search results', async () => {
      mockPrismaService.words.findMany.mockResolvedValue([]);
      mockPrismaService.words.count.mockResolvedValue(0);

      const query = {
        search: 'nonexistent',
        page: 1,
        limit: 10,
      };

      const result = await service.getEntries(query);

      expect(result).toEqual({
        results: [],
        totalDocs: 0,
        page: 1,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should handle case insensitive search', async () => {
      const mockWords = [{ word: 'Fire' }, { word: 'FIREFLY' }];

      mockPrismaService.words.findMany.mockResolvedValue(mockWords);
      mockPrismaService.words.count.mockResolvedValue(2);

      const query = {
        search: 'FIRE',
        page: 1,
        limit: 10,
      };

      const result = await service.getEntries(query);

      expect(result.results).toEqual(['Fire', 'FIREFLY']);

      expect(mockPrismaService.words.findMany).toHaveBeenCalledWith({
        where: {
          word: {
            contains: 'FIRE',
            mode: 'insensitive',
          },
        },
        skip: 0,
        take: 10,
        select: {
          word: true,
        },
      });
    });

    it('should calculate pagination correctly with exact division', async () => {
      const mockWords = [
        { word: 'test1' },
        { word: 'test2' },
        { word: 'test3' },
      ];

      mockPrismaService.words.findMany.mockResolvedValue(mockWords);
      mockPrismaService.words.count.mockResolvedValue(9);

      const query = {
        search: 'test',
        page: 3,
        limit: 3,
      };

      const result = await service.getEntries(query);

      expect(result).toEqual({
        results: ['test1', 'test2', 'test3'],
        totalDocs: 9,
        page: 3,
        totalPages: 3,
        hasNext: false,
        hasPrev: true,
      });
    });

    it('should handle partial search matches', async () => {
      const mockWords = [{ word: 'butterfly' }, { word: 'flutter' }];

      mockPrismaService.words.findMany.mockResolvedValue(mockWords);
      mockPrismaService.words.count.mockResolvedValue(2);

      const query = {
        search: 'fly',
        page: 1,
        limit: 10,
      };

      const result = await service.getEntries(query);

      expect(result.results).toEqual(['butterfly', 'flutter']);
      expect(result.totalDocs).toBe(2);

      expect(mockPrismaService.words.findMany).toHaveBeenCalledWith({
        where: {
          word: {
            contains: 'fly',
            mode: 'insensitive',
          },
        },
        skip: 0,
        take: 10,
        select: {
          word: true,
        },
      });
    });
  });

  describe('getEntryDetail', () => {
    it('should return word details successfully', async () => {
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getEntryDetail('fire');

      expect(result).toEqual(mockWordDetails);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.dictionaryapi.dev/api/v2/entries/en/fire',
      );
    });

    it('should throw NotFoundException when word is not found', async () => {
      const axiosError = new AxiosError('Not Found');
      axiosError.response = { status: 404 } as AxiosResponse;

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getEntryDetail('nonexistentword')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getEntryDetail('nonexistentword')).rejects.toThrow(
        `couldn't find definitions for the word nonexistentword`,
      );

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.dictionaryapi.dev/api/v2/entries/en/nonexistentword',
      );
    });

    it('should throw generic error for other HTTP errors', async () => {
      const axiosError = new AxiosError('Internal Server Error');
      axiosError.response = { status: 500 } as AxiosResponse;

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getEntryDetail('test')).rejects.toThrow(
        'failed to fetch entry details',
      );

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.dictionaryapi.dev/api/v2/entries/en/test',
      );
    });

    it('should throw generic error for non-Axios errors', async () => {
      const genericError = new Error('Network error');

      mockHttpService.get.mockReturnValue(throwError(() => genericError));

      await expect(service.getEntryDetail('test')).rejects.toThrow(
        'failed to fetch entry details',
      );

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.dictionaryapi.dev/api/v2/entries/en/test',
      );
    });

    it('should handle word with special characters', async () => {
      const mockWordDetailsWithSpecialChar = [
        {
          word: 'one-word',
        },
      ];

      const mockResponseWithSpecialChar = {
        data: mockWordDetailsWithSpecialChar,
      };

      mockHttpService.get.mockReturnValue(of(mockResponseWithSpecialChar));

      const result = await service.getEntryDetail('one-word');

      expect(result).toEqual(mockWordDetailsWithSpecialChar);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.dictionaryapi.dev/api/v2/entries/en/one-word',
      );
    });

    it('should handle uppercase word', async () => {
      const mockWordDetails = [
        {
          word: 'FIRE',
        },
      ];

      const mockResponse = {
        data: mockWordDetails,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getEntryDetail('FIRE');

      expect(result).toEqual(mockWordDetails);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.dictionaryapi.dev/api/v2/entries/en/FIRE',
      );
    });

    it('should handle AxiosError without response', async () => {
      const axiosError = new AxiosError('Network Error');

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getEntryDetail('test')).rejects.toThrow(
        'failed to fetch entry details',
      );

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.dictionaryapi.dev/api/v2/entries/en/test',
      );
    });
  });

  describe('getWordId', () => {
    it('should return word id when word exists', async () => {
      const word = 'fire';
      const mockWordEntry = {
        id: 'word-123',
      };

      mockPrismaService.words.findUnique.mockResolvedValue(mockWordEntry);

      const result = await service.getWordId(word);

      expect(result).toBe('word-123');
      expect(mockPrismaService.words.findUnique).toHaveBeenCalledWith({
        where: { word },
        select: { id: true },
      });
    });

    it('should throw NotFoundException when word does not exist', async () => {
      const word = 'nonexistentword';

      mockPrismaService.words.findUnique.mockResolvedValue(null);

      await expect(service.getWordId(word)).rejects.toThrow(NotFoundException);
      await expect(service.getWordId(word)).rejects.toThrow(
        `Word not found: ${word}`,
      );

      expect(mockPrismaService.words.findUnique).toHaveBeenCalledWith({
        where: { word },
        select: { id: true },
      });
    });

    it('should handle empty string word', async () => {
      const word = '';

      mockPrismaService.words.findUnique.mockResolvedValue(null);

      await expect(service.getWordId(word)).rejects.toThrow(NotFoundException);
      await expect(service.getWordId(word)).rejects.toThrow('Word not found: ');

      expect(mockPrismaService.words.findUnique).toHaveBeenCalledWith({
        where: { word },
        select: { id: true },
      });
    });
  });

  describe('addWordToHistory', () => {
    it('should create a new history entry successfully', async () => {
      mockPrismaService.history.create.mockResolvedValue(mockHistoryEntry);

      const result = await service.addWordToHistory(mockUserId, mockWordId);

      expect(result).toEqual(mockHistoryEntry);
      expect(mockPrismaService.history.create).toHaveBeenCalledWith(
        expectedCreateCall,
      );
    });

    it('should handle empty userId', async () => {
      const emptyUserId = '';
      const validationError = new Error('invalid user id');

      mockPrismaService.history.create.mockRejectedValue(validationError);

      await expect(
        service.addWordToHistory(emptyUserId, mockWordId),
      ).rejects.toThrow('invalid user id');

      expect(mockPrismaService.history.create).toHaveBeenCalledWith({
        data: {
          user_id: emptyUserId,
          word_id: mockWordId,
        },
      });
    });

    it('should handle empty wordId', async () => {
      const emptyWordId = '';
      const validationError = new Error('invalid word id');

      mockPrismaService.history.create.mockRejectedValue(validationError);

      await expect(
        service.addWordToHistory(mockUserId, emptyWordId),
      ).rejects.toThrow('invalid word id');

      expect(mockPrismaService.history.create).toHaveBeenCalledWith({
        data: {
          user_id: mockUserId,
          word_id: emptyWordId,
        },
      });
    });
  });

  describe('addWordToFavorites', () => {
    it('should create a new favorite when it does not exist', async () => {
      mockPrismaService.favorites.findFirst.mockResolvedValue(null);
      mockPrismaService.favorites.create.mockResolvedValue(mockFavoriteEntry);

      const result = await service.addWordToFavorites(mockUserId, mockWordId);

      expect(result).toEqual(mockFavoriteEntry);
      expect(mockPrismaService.favorites.findFirst).toHaveBeenCalledWith(
        expectedFindFirstCall,
      );
      expect(mockPrismaService.favorites.create).toHaveBeenCalledWith(
        expectedCreateCall,
      );
    });

    it('should return existing favorite when it already exists', async () => {
      const existingFavorite = {
        id: 'existing-favorite-123',
        user_id: mockUserId,
        word_id: mockWordId,
        created_at: new Date('2025-01-01T00:00:00.000Z'),
      };

      mockPrismaService.favorites.findFirst.mockResolvedValue(existingFavorite);

      const result = await service.addWordToFavorites(mockUserId, mockWordId);

      expect(result).toEqual(existingFavorite);
      expect(mockPrismaService.favorites.findFirst).toHaveBeenCalledWith(
        expectedFindFirstCall,
      );
      expect(mockPrismaService.favorites.create).not.toHaveBeenCalled();
    });

    it('should handle database error during findFirst', async () => {
      const databaseError = new Error('Database connection failed');

      mockPrismaService.favorites.findFirst.mockRejectedValue(databaseError);

      await expect(
        service.addWordToFavorites(mockUserId, mockWordId),
      ).rejects.toThrow('Database connection failed');

      expect(mockPrismaService.favorites.findFirst).toHaveBeenCalledWith(
        expectedFindFirstCall,
      );
      expect(mockPrismaService.favorites.create).not.toHaveBeenCalled();
    });

    it('should handle database error during create', async () => {
      const createError = new Error('Failed to create favorite');

      mockPrismaService.favorites.findFirst.mockResolvedValue(null);
      mockPrismaService.favorites.create.mockRejectedValue(createError);

      await expect(
        service.addWordToFavorites(mockUserId, mockWordId),
      ).rejects.toThrow('Failed to create favorite');

      expect(mockPrismaService.favorites.findFirst).toHaveBeenCalledWith(
        expectedFindFirstCall,
      );
      expect(mockPrismaService.favorites.create).toHaveBeenCalledWith(
        expectedCreateCall,
      );
    });

    it('should handle empty userId', async () => {
      const emptyUserId = '';
      const validationError = new Error('Invalid user ID');

      mockPrismaService.favorites.findFirst.mockRejectedValue(validationError);

      await expect(
        service.addWordToFavorites(emptyUserId, mockWordId),
      ).rejects.toThrow('Invalid user ID');

      expect(mockPrismaService.favorites.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: emptyUserId,
          word_id: mockWordId,
        },
      });
    });

    it('should handle empty wordId', async () => {
      const emptyWordId = '';
      const validationError = new Error('Invalid word ID');

      mockPrismaService.favorites.findFirst.mockRejectedValue(validationError);

      await expect(
        service.addWordToFavorites(mockUserId, emptyWordId),
      ).rejects.toThrow('Invalid word ID');

      expect(mockPrismaService.favorites.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: mockUserId,
          word_id: emptyWordId,
        },
      });
    });

    it('should handle special characters in IDs', async () => {
      const specialUserId = 'user-with@special.chars';
      const specialWordId = 'word-with-hyphens-123';
      const specialFavorite = {
        id: 'favorite-special-789',
        user_id: specialUserId,
        word_id: specialWordId,
        created_at: new Date('2025-08-16T14:30:00.000Z'),
      };

      mockPrismaService.favorites.findFirst.mockResolvedValue(null);
      mockPrismaService.favorites.create.mockResolvedValue(specialFavorite);

      const result = await service.addWordToFavorites(
        specialUserId,
        specialWordId,
      );

      expect(result).toEqual(specialFavorite);
      expect(mockPrismaService.favorites.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: specialUserId,
          word_id: specialWordId,
        },
      });
      expect(mockPrismaService.favorites.create).toHaveBeenCalledWith({
        data: {
          user_id: specialUserId,
          word_id: specialWordId,
        },
      });
    });
  });

  describe('removeWordFromFavorites', () => {
    it('should remove favorite successfully when it exists', async () => {
      const existingFavorite = {
        id: 'favorite-to-delete-123',
        user_id: mockUserId,
        word_id: mockWordId,
        created_at: new Date('2025-01-01T00:00:00.000Z'),
      };

      mockPrismaService.favorites.findFirst.mockResolvedValue(existingFavorite);
      mockPrismaService.favorites.delete.mockResolvedValue(existingFavorite);

      await service.removeWordFromFavorites(mockUserId, mockWordId);

      expect(mockPrismaService.favorites.findFirst).toHaveBeenCalledWith(
        expectedFindFirstCall,
      );
      expect(mockPrismaService.favorites.delete).toHaveBeenCalledWith({
        where: {
          id: existingFavorite.id,
        },
      });
    });

    it('should throw NotFoundException when favorite does not exist', async () => {
      mockPrismaService.favorites.findFirst.mockResolvedValue(null);

      await expect(
        service.removeWordFromFavorites(mockUserId, mockWordId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.removeWordFromFavorites(mockUserId, mockWordId),
      ).rejects.toThrow('user has not set word as its favorite');

      expect(mockPrismaService.favorites.findFirst).toHaveBeenCalledWith(
        expectedFindFirstCall,
      );
      expect(mockPrismaService.favorites.delete).not.toHaveBeenCalled();
    });
  });
});

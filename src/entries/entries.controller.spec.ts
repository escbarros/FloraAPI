import { Test, TestingModule } from '@nestjs/testing';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';
import { JwtGuard } from '../shared/middleware/jwt.guard';
import type { RequestWithUser } from '../shared/types/JwtRequest';
import { UserService } from '../user/user.service';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { CacheService } from '../shared/cache.service';

describe('EntriesController', () => {
  let controller: EntriesController;

  const mockEntriesService = {
    getEntries: jest.fn(),
    getEntryDetail: jest.fn(),
    getWordId: jest.fn(),
    addWordToHistory: jest.fn(),
    addWordToFavorites: jest.fn(),
    removeWordFromFavorites: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    invalidateUserCache: jest.fn(),
  };

  const mockJwtGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockRequest = {
    user: { sub: '1', email: 'test@test.com' },
  } as RequestWithUser;

  const mockWordDetails = [
    {
      word: 'fire',
    },
  ];

  const mockDefaultWord = 'fire';
  const mockDefaultWordId = 'word-123';
  const mockUserId = '1';
  const mockSpecialWord = 'test-word';
  const mockSpecialWordId = 'word-special-789';

  const mockHistoryResponse = {};

  const expectFullWordDetailFlow = (word: string, wordId: string) => {
    expect(mockEntriesService.getWordId).toHaveBeenCalledWith(word);
    expect(mockEntriesService.getEntryDetail).toHaveBeenCalledWith(word);
    expect(mockEntriesService.addWordToHistory).toHaveBeenCalledWith(
      mockUserId,
      wordId,
    );
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [EntriesController],
      providers: [
        {
          provide: EntriesService,
          useValue: mockEntriesService,
        },
        {
          provide: UserService,
          useValue: mockEntriesService,
        },
        {
          provide: CacheService,
          useValue: mockCacheManager,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue(mockJwtGuard)
      .compile();

    controller = module.get<EntriesController>(EntriesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEntries', () => {
    it('should return entries with pagination', async () => {
      const mockResponse = {
        results: ['fire', 'firefly', 'fireplace'],
        totalDocs: 20,
        page: 1,
        totalPages: 7,
        hasNext: true,
        hasPrev: false,
      };

      mockEntriesService.getEntries.mockResolvedValue(mockResponse);

      const result = await controller.getEntries('fire', '3', '1');

      expect(result).toEqual(mockResponse);
      expect(mockEntriesService.getEntries).toHaveBeenCalledWith({
        search: 'fire',
        limit: 3,
        page: 1,
      });
    });

    it('should handle second page correctly', async () => {
      const mockResponse = {
        results: ['fireman', 'firewood'],
        totalDocs: 20,
        page: 2,
        totalPages: 7,
        hasNext: true,
        hasPrev: true,
      };

      mockEntriesService.getEntries.mockResolvedValue(mockResponse);

      const result = await controller.getEntries('fire', '3', '2');

      expect(result).toEqual(mockResponse);
      expect(mockEntriesService.getEntries).toHaveBeenCalledWith({
        search: 'fire',
        limit: 3,
        page: 2,
      });
    });

    it('should handle empty search results', async () => {
      const mockResponse = {
        results: [],
        totalDocs: 0,
        page: 1,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      mockEntriesService.getEntries.mockResolvedValue(mockResponse);

      const result = await controller.getEntries('NONEXISTENT', '10', '1');

      expect(result).toEqual(mockResponse);
      expect(mockEntriesService.getEntries).toHaveBeenCalledWith({
        search: 'NONEXISTENT',
        limit: 10,
        page: 1,
      });
    });

    it('should handle query without search parameter', async () => {
      const mockResponse = {
        results: ['apple', 'banana', 'cherry'],
        totalDocs: 100,
        page: 1,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };

      mockEntriesService.getEntries.mockResolvedValue(mockResponse);

      const result = await controller.getEntries(undefined, '10', '1');

      expect(result).toEqual(mockResponse);
      expect(mockEntriesService.getEntries).toHaveBeenCalledWith({
        search: '',
        limit: 10,
        page: 1,
      });
    });

    it('should use default values when no parameters provided', async () => {
      const mockResponse = {
        results: ['default1', 'default2'],
        totalDocs: 2,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      mockEntriesService.getEntries.mockResolvedValue(mockResponse);

      const result = await controller.getEntries();

      expect(result).toEqual(mockResponse);
      expect(mockEntriesService.getEntries).toHaveBeenCalledWith({
        search: '',
        limit: 10,
        page: 1,
      });
    });

    it('should handle last page correctly', async () => {
      const mockResponse = {
        results: ['firewall'],
        totalDocs: 10,
        page: 4,
        totalPages: 4,
        hasNext: false,
        hasPrev: true,
      };

      mockEntriesService.getEntries.mockResolvedValue(mockResponse);

      const result = await controller.getEntries('fire', '3', '4');

      expect(result).toEqual(mockResponse);
      expect(mockEntriesService.getEntries).toHaveBeenCalledWith({
        search: 'fire',
        limit: 3,
        page: 4,
      });
    });

    it('should handle case insensitive search', async () => {
      const mockResponse = {
        results: ['Fire', 'FIREFLY'],
        totalDocs: 2,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      mockEntriesService.getEntries.mockResolvedValue(mockResponse);

      const result = await controller.getEntries('FIRE', '10', '1');

      expect(result).toEqual(mockResponse);
      expect(mockEntriesService.getEntries).toHaveBeenCalledWith({
        search: 'FIRE',
        limit: 10,
        page: 1,
      });
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Database connection failed';
      mockEntriesService.getEntries.mockRejectedValue(new Error(errorMessage));

      await expect(controller.getEntries('fire', '3', '1')).rejects.toThrow(
        errorMessage,
      );

      expect(mockEntriesService.getEntries).toHaveBeenCalledWith({
        search: 'fire',
        limit: 3,
        page: 1,
      });
    });
  });

  describe('getEntryDetail', () => {
    it('should return word details successfully', async () => {
      mockEntriesService.getWordId.mockResolvedValue(mockDefaultWordId);
      mockEntriesService.getEntryDetail.mockResolvedValue(mockWordDetails);
      mockEntriesService.addWordToHistory.mockResolvedValue(
        mockHistoryResponse,
      );

      const result = await controller.getEntryDetail(
        mockRequest,
        mockDefaultWord,
      );

      expect(result).toEqual(mockWordDetails);
      expectFullWordDetailFlow(mockDefaultWord, mockDefaultWordId);
    });

    it('should handle word not found error', async () => {
      const word = 'nonexistentword';
      const errorMessage = `couldn't find definitions for the word ${word}`;

      mockEntriesService.getWordId.mockRejectedValue(new Error(errorMessage));

      await expect(
        controller.getEntryDetail(mockRequest, word),
      ).rejects.toThrow(errorMessage);
      expect(mockEntriesService.getWordId).toHaveBeenCalledWith(word);
    });

    it('should handle service errors', async () => {
      const word = 'test';
      const wordId = 'word-456';

      mockEntriesService.getWordId.mockResolvedValue(wordId);
      mockEntriesService.getEntryDetail.mockRejectedValue(
        new Error('failed to fetch entry details'),
      );

      await expect(
        controller.getEntryDetail(mockRequest, word),
      ).rejects.toThrow('failed to fetch entry details');
      expect(mockEntriesService.getWordId).toHaveBeenCalledWith(word);
      expect(mockEntriesService.getEntryDetail).toHaveBeenCalledWith(word);
    });

    it('should handle special characters in word parameter', async () => {
      const wordDetailsWithSpecialChar = [
        {
          word: mockSpecialWord,
        },
      ];

      mockEntriesService.getWordId.mockResolvedValue(mockSpecialWordId);
      mockEntriesService.getEntryDetail.mockResolvedValue(
        wordDetailsWithSpecialChar,
      );
      mockEntriesService.addWordToHistory.mockResolvedValue(
        mockHistoryResponse,
      );

      const result = await controller.getEntryDetail(
        mockRequest,
        mockSpecialWord,
      );

      expect(result).toEqual(wordDetailsWithSpecialChar);
      expectFullWordDetailFlow(mockSpecialWord, mockSpecialWordId);
    });
  });

  describe('addWordToFavorites', () => {
    it('should add word to favorites successfully', async () => {
      const mockFavoriteResponse = {
        id: 'favorite-123',
        user_id: mockUserId,
        word_id: mockDefaultWordId,
        created_at: new Date(),
      };

      mockEntriesService.getWordId.mockResolvedValue(mockDefaultWordId);
      mockEntriesService.addWordToFavorites.mockResolvedValue(
        mockFavoriteResponse,
      );

      await controller.addWordToFavorites(mockRequest, mockDefaultWord);

      expect(mockEntriesService.getWordId).toHaveBeenCalledWith(
        mockDefaultWord,
      );
      expect(mockEntriesService.addWordToFavorites).toHaveBeenCalledWith(
        mockUserId,
        mockDefaultWordId,
      );
    });

    it('should handle word not found error when adding to favorites', async () => {
      const word = 'nonexistentword';
      const errorMessage = `Word not found: ${word}`;

      mockEntriesService.getWordId.mockRejectedValue(new Error(errorMessage));

      await expect(
        controller.addWordToFavorites(mockRequest, word),
      ).rejects.toThrow(errorMessage);
      expect(mockEntriesService.getWordId).toHaveBeenCalledWith(word);
      expect(mockEntriesService.addWordToFavorites).not.toHaveBeenCalled();
    });

    it('should handle duplicate favorites', async () => {
      const existingFavorite = {
        id: 'favorite-existing-789',
        user_id: mockUserId,
        word_id: mockDefaultWordId,
        created_at: new Date('2025-01-01'),
      };

      mockEntriesService.getWordId.mockResolvedValue(mockDefaultWordId);
      mockEntriesService.addWordToFavorites.mockResolvedValue(existingFavorite);

      await controller.addWordToFavorites(mockRequest, mockDefaultWord);

      expect(mockEntriesService.getWordId).toHaveBeenCalledWith(
        mockDefaultWord,
      );
      expect(mockEntriesService.addWordToFavorites).toHaveBeenCalledWith(
        mockUserId,
        mockDefaultWordId,
      );
    });

    it('should handle empty word parameter in favorites', async () => {
      const word = '';
      const errorMessage = 'Word not found: ';

      mockEntriesService.getWordId.mockRejectedValue(new Error(errorMessage));

      await expect(
        controller.addWordToFavorites(mockRequest, word),
      ).rejects.toThrow(errorMessage);
      expect(mockEntriesService.getWordId).toHaveBeenCalledWith(word);
      expect(mockEntriesService.addWordToFavorites).not.toHaveBeenCalled();
    });
  });

  describe('removeWordFromFavorites', () => {
    it('should remove word from favorites successfully', async () => {
      mockEntriesService.getWordId.mockResolvedValue(mockDefaultWordId);
      mockEntriesService.removeWordFromFavorites.mockResolvedValue(undefined);

      await controller.removeWordFromFavorites(mockRequest, mockDefaultWord);

      expect(mockEntriesService.getWordId).toHaveBeenCalledWith(
        mockDefaultWord,
      );
      expect(mockEntriesService.removeWordFromFavorites).toHaveBeenCalledWith(
        mockUserId,
        mockDefaultWordId,
      );
    });

    it('should handle word not found error when removing from favorites', async () => {
      const word = 'nonexistentword';
      const errorMessage = `Word not found: ${word}`;

      mockEntriesService.getWordId.mockRejectedValue(new Error(errorMessage));

      await expect(
        controller.removeWordFromFavorites(mockRequest, word),
      ).rejects.toThrow(errorMessage);
      expect(mockEntriesService.getWordId).toHaveBeenCalledWith(word);
      expect(mockEntriesService.removeWordFromFavorites).not.toHaveBeenCalled();
    });

    it('should handle favorite not found error', async () => {
      const errorMessage = 'user has not set word as its favorite';

      mockEntriesService.getWordId.mockResolvedValue(mockDefaultWordId);
      mockEntriesService.removeWordFromFavorites.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        controller.removeWordFromFavorites(mockRequest, mockDefaultWord),
      ).rejects.toThrow(errorMessage);
      expect(mockEntriesService.getWordId).toHaveBeenCalledWith(
        mockDefaultWord,
      );
      expect(mockEntriesService.removeWordFromFavorites).toHaveBeenCalledWith(
        mockUserId,
        mockDefaultWordId,
      );
    });
  });
});

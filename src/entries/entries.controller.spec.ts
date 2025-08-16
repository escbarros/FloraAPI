import { Test, TestingModule } from '@nestjs/testing';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';
import { JwtGuard } from '../shared/middleware/jwt.guard';
import type { RequestWithUser } from '../shared/types/JwtRequest';
import { UserService } from '../user/user.service';

describe('EntriesController', () => {
  let controller: EntriesController;

  const mockEntriesService = {
    getEntries: jest.fn(),
    getEntryDetail: jest.fn(),
    getWordId: jest.fn(),
  };

  const mockUserService = {
    addWordToHistory: jest.fn(),
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
    expect(mockUserService.addWordToHistory).toHaveBeenCalledWith(
      mockUserId,
      wordId,
    );
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        {
          provide: EntriesService,
          useValue: mockEntriesService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
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
      mockUserService.addWordToHistory.mockResolvedValue(mockHistoryResponse);

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
      mockUserService.addWordToHistory.mockResolvedValue(mockHistoryResponse);

      const result = await controller.getEntryDetail(
        mockRequest,
        mockSpecialWord,
      );

      expect(result).toEqual(wordDetailsWithSpecialChar);
      expectFullWordDetailFlow(mockSpecialWord, mockSpecialWordId);
    });
  });
});

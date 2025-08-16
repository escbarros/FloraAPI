import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../shared/prisma.service';

describe('UserService', () => {
  let service: UserService;

  const mockPrismaService = {
    history: {
      create: jest.fn(),
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

  const expectedCreateCall = {
    data: {
      user_id: mockUserId,
      word_id: mockWordId,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
});

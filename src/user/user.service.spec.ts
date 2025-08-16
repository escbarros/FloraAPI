import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../shared/prisma.service';

describe('UserService', () => {
  let service: UserService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    history: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    favorites: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockUserId = 'user-123';
  const mockHistoryRecords = [
    {
      word: { word: 'fire' },
      created_at: new Date('2025-08-16T17:55:46.182Z'),
    },
    {
      word: { word: 'test' },
      created_at: new Date('2025-08-16T17:43:50.781Z'),
    },
  ];

  const mockExpectedResults = [
    {
      word: 'fire',
      added: new Date('2025-08-16T17:55:46.182Z'),
    },
    {
      word: 'test',
      added: new Date('2025-08-16T17:43:50.781Z'),
    },
  ];

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

  describe('getUserProfile', () => {
    it('should return user profile when user exists', async () => {
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserProfile(mockUserId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserProfile(mockUserId)).rejects.toThrow(
        'User not found',
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    });
  });

  describe('getUserHistory', () => {
    it('should return user history with pagination on first page', async () => {
      const limit = 10;
      const page = 1;
      const totalDocs = 15;

      mockPrismaService.history.findMany.mockResolvedValue(mockHistoryRecords);
      mockPrismaService.history.count.mockResolvedValue(totalDocs);

      const result = await service.getUserHistory({
        userId: mockUserId,
        limit,
        page,
      });

      expect(result).toEqual({
        results: mockExpectedResults,
        totalDocs,
        page,
        totalPages: 2,
        hasNext: true,
        hasPrev: false,
      });

      expect(mockPrismaService.history.findMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
        select: {
          word: { select: { word: true } },
          created_at: true,
        },
        skip: 0,
        take: limit,
        orderBy: { created_at: 'desc' },
      });

      expect(mockPrismaService.history.count).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
      });
    });

    it('should return user history with pagination on second page', async () => {
      const limit = 5;
      const page = 2;
      const totalDocs = 12;

      mockPrismaService.history.findMany.mockResolvedValue(mockHistoryRecords);
      mockPrismaService.history.count.mockResolvedValue(totalDocs);

      const result = await service.getUserHistory({
        userId: mockUserId,
        limit,
        page,
      });

      expect(result).toEqual({
        results: mockExpectedResults,
        totalDocs,
        page,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });

      expect(mockPrismaService.history.findMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
        select: {
          word: { select: { word: true } },
          created_at: true,
        },
        skip: 5,
        take: limit,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should return user history on last page', async () => {
      const limit = 10;
      const page = 3;
      const totalDocs = 25;

      mockPrismaService.history.findMany.mockResolvedValue(mockHistoryRecords);
      mockPrismaService.history.count.mockResolvedValue(totalDocs);

      const result = await service.getUserHistory({
        userId: mockUserId,
        limit,
        page,
      });

      expect(result).toEqual({
        results: mockExpectedResults,
        totalDocs,
        page,
        totalPages: 3,
        hasNext: false,
        hasPrev: true,
      });

      expect(mockPrismaService.history.findMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
        select: {
          word: { select: { word: true } },
          created_at: true,
        },
        skip: 20,
        take: limit,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should return empty history when user has no records', async () => {
      const limit = 10;
      const page = 1;
      const totalDocs = 0;

      mockPrismaService.history.findMany.mockResolvedValue([]);
      mockPrismaService.history.count.mockResolvedValue(totalDocs);

      const result = await service.getUserHistory({
        userId: mockUserId,
        limit,
        page,
      });

      expect(result).toEqual({
        results: [],
        totalDocs: 0,
        page: 1,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should handle single page results', async () => {
      const limit = 10;
      const page = 1;
      const totalDocs = 2;

      mockPrismaService.history.findMany.mockResolvedValue(mockHistoryRecords);
      mockPrismaService.history.count.mockResolvedValue(totalDocs);

      const result = await service.getUserHistory({
        userId: mockUserId,
        limit,
        page,
      });

      expect(result).toEqual({
        results: mockExpectedResults,
        totalDocs: 2,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });
  });

  describe('getUserFavorites', () => {
    it('should return user favorites with pagination on first page', async () => {
      const limit = 10;
      const page = 1;
      const totalDocs = 15;

      mockPrismaService.favorites.findMany.mockResolvedValue(
        mockHistoryRecords,
      );
      mockPrismaService.favorites.count.mockResolvedValue(totalDocs);

      const result = await service.getUserFavorites({
        userId: mockUserId,
        limit,
        page,
      });

      expect(result).toEqual({
        results: mockExpectedResults,
        totalDocs,
        page,
        totalPages: 2,
        hasNext: true,
        hasPrev: false,
      });

      expect(mockPrismaService.favorites.findMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
        select: {
          word: { select: { word: true } },
          created_at: true,
        },
        skip: 0,
        take: limit,
        orderBy: { created_at: 'desc' },
      });

      expect(mockPrismaService.favorites.count).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
      });
    });

    it('should return user favorites with pagination on second page', async () => {
      const limit = 5;
      const page = 2;
      const totalDocs = 12;

      mockPrismaService.favorites.findMany.mockResolvedValue(
        mockHistoryRecords,
      );
      mockPrismaService.favorites.count.mockResolvedValue(totalDocs);

      const result = await service.getUserFavorites({
        userId: mockUserId,
        limit,
        page,
      });

      expect(result).toEqual({
        results: mockExpectedResults,
        totalDocs,
        page,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });

      expect(mockPrismaService.favorites.findMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
        select: {
          word: { select: { word: true } },
          created_at: true,
        },
        skip: 5,
        take: limit,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should return user favorites on last page', async () => {
      const limit = 10;
      const page = 3;
      const totalDocs = 25;

      mockPrismaService.favorites.findMany.mockResolvedValue(
        mockHistoryRecords,
      );
      mockPrismaService.favorites.count.mockResolvedValue(totalDocs);

      const result = await service.getUserFavorites({
        userId: mockUserId,
        limit,
        page,
      });

      expect(result).toEqual({
        results: mockExpectedResults,
        totalDocs,
        page,
        totalPages: 3,
        hasNext: false,
        hasPrev: true,
      });

      expect(mockPrismaService.favorites.findMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
        select: {
          word: { select: { word: true } },
          created_at: true,
        },
        skip: 20,
        take: limit,
        orderBy: { created_at: 'desc' },
      });
    });

    it('should return empty favorites when user has no records', async () => {
      const limit = 10;
      const page = 1;
      const totalDocs = 0;

      mockPrismaService.favorites.findMany.mockResolvedValue([]);
      mockPrismaService.favorites.count.mockResolvedValue(totalDocs);

      const result = await service.getUserFavorites({
        userId: mockUserId,
        limit,
        page,
      });

      expect(result).toEqual({
        results: [],
        totalDocs: 0,
        page: 1,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should handle single page results for favorites', async () => {
      const limit = 10;
      const page = 1;
      const totalDocs = 2;

      mockPrismaService.favorites.findMany.mockResolvedValue(
        mockHistoryRecords,
      );
      mockPrismaService.favorites.count.mockResolvedValue(totalDocs);

      const result = await service.getUserFavorites({
        userId: mockUserId,
        limit,
        page,
      });

      expect(result).toEqual({
        results: mockExpectedResults,
        totalDocs: 2,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });
  });
});

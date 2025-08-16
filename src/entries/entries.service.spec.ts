import { Test, TestingModule } from '@nestjs/testing';
import { EntriesService } from './entries.service';
import { PrismaService } from '../shared/prisma.service';

describe('EntriesService', () => {
  let service: EntriesService;

  const mockPrismaService = {
    words: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
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
});

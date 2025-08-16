import { Test, TestingModule } from '@nestjs/testing';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';
import { JwtGuard } from '../shared/middleware/jwt.guard';
import type { RequestWithUser } from '../shared/types/JwtRequest';

describe('EntriesController', () => {
  let controller: EntriesController;

  const mockEntriesService = {
    getEntries: jest.fn(),
  };

  const mockJwtGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        {
          provide: EntriesService,
          useValue: mockEntriesService,
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

      const mockRequest = {
        user: { sub: '1', email: 'test@example.com' },
      } as unknown as RequestWithUser;

      const result = await controller.getEntries(mockRequest, 'fire', '3', '1');

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

      const mockRequest = {
        user: { sub: '1', email: 'test@example.com' },
      } as RequestWithUser;

      const result = await controller.getEntries(mockRequest, 'fire', '3', '2');

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

      const mockRequest = {
        user: { sub: '1', email: 'test@example.com' },
      } as RequestWithUser;

      const result = await controller.getEntries(
        mockRequest,
        'NONEXISTENT',
        '10',
        '1',
      );

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

      const mockRequest = {
        user: { sub: '1', email: 'test@example.com' },
      } as RequestWithUser;

      const result = await controller.getEntries(
        mockRequest,
        undefined,
        '10',
        '1',
      );

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

      const mockRequest = {
        user: { sub: '1', email: 'test@example.com' },
      } as RequestWithUser;

      const result = await controller.getEntries(mockRequest);

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

      const mockRequest = {
        user: { sub: '1', email: 'test@example.com' },
      } as RequestWithUser;

      const result = await controller.getEntries(mockRequest, 'fire', '3', '4');

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

      const mockRequest = {
        user: { sub: '1', email: 'test@example.com' },
      } as RequestWithUser;

      const result = await controller.getEntries(
        mockRequest,
        'FIRE',
        '10',
        '1',
      );

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

      const mockRequest = {
        user: { sub: '1', email: 'test@example.com' },
      } as RequestWithUser;

      await expect(
        controller.getEntries(mockRequest, 'fire', '3', '1'),
      ).rejects.toThrow(errorMessage);

      expect(mockEntriesService.getEntries).toHaveBeenCalledWith({
        search: 'fire',
        limit: 3,
        page: 1,
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtGuard } from '../shared/middleware/jwt.guard';
import type { RequestWithUser } from '../shared/types/JwtRequest';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    getUserProfile: jest.fn(),
    getUserHistory: jest.fn(),
    getUserFavorites: jest.fn(),
  };

  const mockJwtGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockRequest = {
    user: {
      sub: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@test.com',
    },
  } as RequestWithUser;

  const mockHistoryResponse = {
    results: [
      {
        word: 'fire',
        added: new Date('2025-08-16T17:55:46.182Z'),
      },
      {
        word: 'test',
        added: new Date('2025-08-16T17:43:50.781Z'),
      },
    ],
    totalDocs: 15,
    page: 1,
    totalPages: 2,
    hasNext: true,
    hasPrev: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue(mockJwtGuard)
      .compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      const mockProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@test.com',
        name: 'Test User',
      };

      mockUserService.getUserProfile.mockResolvedValue(mockProfile);

      const result = await controller.getUserProfile(mockRequest);

      expect(result).toEqual(mockProfile);
      expect(mockUserService.getUserProfile).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
      );
    });

    it('should handle user not found error', async () => {
      const errorMessage = 'User not found';
      mockUserService.getUserProfile.mockRejectedValue(new Error(errorMessage));

      await expect(controller.getUserProfile(mockRequest)).rejects.toThrow(
        errorMessage,
      );

      expect(mockUserService.getUserProfile).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
      );
    });

    it('should pass through user ID from JWT token for profile', async () => {
      const differentUserRequest = {
        user: {
          sub: '650e8400-e29b-41d4-a716-446655440001',
          email: 'other@test.com',
        },
      } as RequestWithUser;

      const mockProfile = {
        id: '650e8400-e29b-41d4-a716-446655440001',
        email: 'other@test.com',
        name: 'Other User',
      };

      mockUserService.getUserProfile.mockResolvedValue(mockProfile);

      const result = await controller.getUserProfile(differentUserRequest);

      expect(result).toEqual(mockProfile);
      expect(mockUserService.getUserProfile).toHaveBeenCalledWith(
        '650e8400-e29b-41d4-a716-446655440001',
      );
    });
  });

  describe('getUserHistory', () => {
    it('should return user history with default pagination', async () => {
      mockUserService.getUserHistory.mockResolvedValue(mockHistoryResponse);

      const result = await controller.getUserHistory(mockRequest);

      expect(result).toEqual(mockHistoryResponse);
      expect(mockUserService.getUserHistory).toHaveBeenCalledWith({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 10,
        page: 1,
      });
    });

    it('should return user history with custom pagination', async () => {
      const customResponse = {
        ...mockHistoryResponse,
        page: 2,
        hasPrev: true,
      };

      mockUserService.getUserHistory.mockResolvedValue(customResponse);

      const result = await controller.getUserHistory(mockRequest, '5', '2');

      expect(result).toEqual(customResponse);
      expect(mockUserService.getUserHistory).toHaveBeenCalledWith({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 5,
        page: 2,
      });
    });

    it('should handle empty history', async () => {
      const emptyResponse = {
        results: [],
        totalDocs: 0,
        page: 1,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      mockUserService.getUserHistory.mockResolvedValue(emptyResponse);

      const result = await controller.getUserHistory(mockRequest);

      expect(result).toEqual(emptyResponse);
      expect(mockUserService.getUserHistory).toHaveBeenCalledWith({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 10,
        page: 1,
      });
    });

    it('should handle validation errors from schema parsing', async () => {
      mockUserService.getUserHistory.mockResolvedValue(mockHistoryResponse);

      const result = await controller.getUserHistory(mockRequest, '1', '1');

      expect(result).toEqual(mockHistoryResponse);
      expect(mockUserService.getUserHistory).toHaveBeenCalledWith({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 1,
        page: 1,
      });
    });

    it('should pass through user ID from JWT token', async () => {
      const differentUserRequest = {
        user: {
          sub: '650e8400-e29b-41d4-a716-446655440001',
          email: 'other@test.com',
        },
      } as RequestWithUser;

      mockUserService.getUserHistory.mockResolvedValue(mockHistoryResponse);

      await controller.getUserHistory(differentUserRequest, '5', '2');

      expect(mockUserService.getUserHistory).toHaveBeenCalledWith({
        userId: '650e8400-e29b-41d4-a716-446655440001',
        limit: 5,
        page: 2,
      });
    });
  });

  describe('getUserFavorites', () => {
    it('should return user favorites with default pagination', async () => {
      mockUserService.getUserFavorites.mockResolvedValue(mockHistoryResponse);

      const result = await controller.getUserFavorites(mockRequest);

      expect(result).toEqual(mockHistoryResponse);
      expect(mockUserService.getUserFavorites).toHaveBeenCalledWith({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 10,
        page: 1,
      });
    });

    it('should return user favorites with custom pagination', async () => {
      const customResponse = {
        ...mockHistoryResponse,
        page: 2,
        hasPrev: true,
      };

      mockUserService.getUserFavorites.mockResolvedValue(customResponse);

      const result = await controller.getUserFavorites(mockRequest, '5', '2');

      expect(result).toEqual(customResponse);
      expect(mockUserService.getUserFavorites).toHaveBeenCalledWith({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 5,
        page: 2,
      });
    });

    it('should handle empty favorites', async () => {
      const emptyResponse = {
        results: [],
        totalDocs: 0,
        page: 1,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      mockUserService.getUserFavorites.mockResolvedValue(emptyResponse);

      const result = await controller.getUserFavorites(mockRequest);

      expect(result).toEqual(emptyResponse);
      expect(mockUserService.getUserFavorites).toHaveBeenCalledWith({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        limit: 10,
        page: 1,
      });
    });

    it('should pass through user ID from JWT token for favorites', async () => {
      const differentUserRequest = {
        user: {
          sub: '650e8400-e29b-41d4-a716-446655440001',
          email: 'other@test.com',
        },
      } as RequestWithUser;

      mockUserService.getUserFavorites.mockResolvedValue(mockHistoryResponse);

      await controller.getUserFavorites(differentUserRequest, '5', '2');

      expect(mockUserService.getUserFavorites).toHaveBeenCalledWith({
        userId: '650e8400-e29b-41d4-a716-446655440001',
        limit: 5,
        page: 2,
      });
    });
  });
});

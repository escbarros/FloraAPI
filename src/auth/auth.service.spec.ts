import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../shared/prisma.service';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;

  const createSignupData = (overrides = {}) => ({
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
    ...overrides,
  });

  const createSigninData = (overrides = {}) => ({
    email: 'test@example.com',
    password: 'password123',
    ...overrides,
  });

  const createMockUser = (overrides = {}) => ({
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    created_at: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  describe('signup', () => {
    it('should successfully create a user with hashed password', async () => {
      const signupData = createSignupData();
      const hashedPassword = 'hashedPassword123';
      const mockUser = createMockUser({ password: hashedPassword });

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      const createSpy = jest
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue(mockUser);

      const result = await service.signup(signupData);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(signupData.password, 10);
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          email: signupData.email,
          name: signupData.name,
          password: hashedPassword,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should handle bcrypt hashing errors', async () => {
      const signupData = createSignupData();
      const hashError = new Error('Hashing failed');

      mockedBcrypt.hash.mockRejectedValue(hashError as never);
      const createSpy = jest.spyOn(prismaService.user, 'create');

      await expect(service.signup(signupData)).rejects.toThrow(hashError);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(signupData.password, 10);
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should handle database creation errors', async () => {
      const signupData = createSignupData();
      const hashedPassword = 'hashedPassword123';
      const dbError = new Error('Database error');

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      const createSpy = jest
        .spyOn(prismaService.user, 'create')
        .mockRejectedValue(dbError);

      await expect(service.signup(signupData)).rejects.toThrow(dbError);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(signupData.password, 10);
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          email: signupData.email,
          name: signupData.name,
          password: hashedPassword,
        },
      });
    });
  });

  describe('signin', () => {
    it('should successfully signin a user with valid credentials', async () => {
      const signinData = createSigninData();
      const mockUser = createMockUser();

      const findUniqueSpy = jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.signin(signinData);

      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { email: signinData.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        signinData.password,
        mockUser.password,
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle user not found error', async () => {
      const signinData = createSigninData();

      const findUniqueSpy = jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(null);

      await expect(service.signin(signinData)).rejects.toThrow(
        'invalid credentials',
      );
      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { email: signinData.email },
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should handle invalid password error', async () => {
      const signinData = createSigninData();
      const mockUser = createMockUser();

      const findUniqueSpy = jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.signin(signinData)).rejects.toThrow(
        'invalid credentials',
      );
      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { email: signinData.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        signinData.password,
        mockUser.password,
      );
    });

    it('should handle database lookup errors', async () => {
      const signinData = createSigninData();
      const dbError = new Error('Database connection failed');

      const findUniqueSpy = jest
        .spyOn(prismaService.user, 'findUnique')
        .mockRejectedValue(dbError);

      await expect(service.signin(signinData)).rejects.toThrow(dbError);
      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { email: signinData.email },
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should handle bcrypt compare errors', async () => {
      const signinData = createSigninData();
      const mockUser = createMockUser();
      const compareError = new Error('Bcrypt comparison failed');

      const findUniqueSpy = jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockRejectedValue(compareError as never);

      await expect(service.signin(signinData)).rejects.toThrow(compareError);
      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { email: signinData.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        signinData.password,
        mockUser.password,
      );
    });

    it('should work with different user credentials', async () => {
      const signinData = createSigninData({
        email: 'another@test.com',
        password: 'differentPassword',
      });
      const mockUser = createMockUser({
        id: '2',
        email: 'another@test.com',
        password: 'differentHashedPassword',
      });

      const findUniqueSpy = jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.signin(signinData);

      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { email: 'another@test.com' },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'differentPassword',
        'differentHashedPassword',
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('generateJwt', () => {
    it('should generate JWT with user data using default secret', () => {
      const user = { id: '1', email: 'test@example.com' };
      const mockToken = 'generated-jwt-token';

      mockedJwt.sign.mockReturnValue(mockToken as never);

      const result = service.generateJwt(user);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { sub: user.id, email: user.email },
        'secret',
        { expiresIn: '1d' },
      );
      expect(result).toBe(mockToken);
    });

    it('should generate JWT with custom JWT_SECRET from environment', () => {
      const user = { id: '2', email: 'another@test.com' };
      const mockToken = 'custom-jwt-token';
      const customSecret = 'custom-secret-key';

      process.env.JWT_SECRET = customSecret;
      mockedJwt.sign.mockReturnValue(mockToken as never);

      const result = service.generateJwt(user);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { sub: user.id, email: user.email },
        customSecret,
        { expiresIn: '1d' },
      );
      expect(result).toBe(mockToken);
    });

    it('should handle JWT generation errors', () => {
      const user = { id: '1', email: 'test@example.com' };
      const jwtError = new Error('JWT generation failed');

      mockedJwt.sign.mockImplementation(() => {
        throw jwtError;
      });

      expect(() => service.generateJwt(user)).toThrow(jwtError);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { sub: user.id, email: user.email },
        'secret',
        { expiresIn: '1d' },
      );
    });
  });

  describe('service definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have prismaService injected', () => {
      expect(prismaService).toBeDefined();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response-dto';
import { ZodError } from 'zod';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const createMockUser = (overrides = {}) => ({
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    created_at: new Date('2023-01-01'),
    ...overrides,
  });

  const createSignupBody = (overrides = {}) => ({
    email: 'test@example.com',
    name: 'Test User',
    password: '123456',
    ...overrides,
  });
  const createSigninBody = (overrides = {}) => ({
    email: 'test@example.com',
    password: '123456',
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn(),
            signin: jest.fn(),
            generateJwt: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should successfully signup a user and return response DTO', async () => {
      const signupBody = createSignupBody();
      const mockUser = createMockUser();
      const mockToken = 'jwt-token-123';
      const expectedResponse = new AuthResponseDto(
        mockUser.id,
        mockUser.name,
        mockToken,
      );

      const signupSpy = jest
        .spyOn(authService, 'signup')
        .mockResolvedValue(mockUser);
      const generateJwtSpy = jest
        .spyOn(authService, 'generateJwt')
        .mockReturnValue(mockToken);

      const result = await controller.signup(signupBody);

      expect(signupSpy).toHaveBeenCalledWith(signupBody);
      expect(signupSpy).toHaveBeenCalledTimes(1);
      expect(generateJwtSpy).toHaveBeenCalledWith(mockUser);
      expect(generateJwtSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle validation error when name is missing', async () => {
      const invalidSignupBody = createSignupBody({ name: undefined });

      await expect(controller.signup(invalidSignupBody)).rejects.toThrow(
        ZodError,
      );
    });

    it('should handle validation error when email is missing', async () => {
      const invalidSignupBody = createSignupBody({ email: undefined });

      await expect(controller.signup(invalidSignupBody)).rejects.toThrow(
        ZodError,
      );
    });
    it('should handle validation error when email is invalid', async () => {
      const invalidSignupBody = createSignupBody({ email: 'invalid-email' });

      await expect(controller.signup(invalidSignupBody)).rejects.toThrow(
        ZodError,
      );
    });

    it('should handle validation error when password is missing', async () => {
      const invalidSignupBody = createSignupBody({ password: undefined });

      await expect(controller.signup(invalidSignupBody)).rejects.toThrow(
        ZodError,
      );
    });

    it('should handle validation error when password is invalid', async () => {
      const invalidSignupBody = createSignupBody({ password: '123' });

      await expect(controller.signup(invalidSignupBody)).rejects.toThrow(
        ZodError,
      );
    });

    it('should handle email already exists error', async () => {
      const signupBody = createSignupBody();
      const error = new Error('Email already exists');

      const signupSpy = jest
        .spyOn(authService, 'signup')
        .mockRejectedValue(error);
      const generateJwtSpy = jest.spyOn(authService, 'generateJwt');

      await expect(controller.signup(signupBody)).rejects.toThrow(error);
      expect(signupSpy).toHaveBeenCalledWith(signupBody);
      expect(generateJwtSpy).not.toHaveBeenCalled();
    });

    it('should handle JWT generation errors', async () => {
      const signupBody = createSignupBody();
      const mockUser = createMockUser();
      const jwtError = new Error('JWT generation failed');

      const signupSpy = jest
        .spyOn(authService, 'signup')
        .mockResolvedValue(mockUser);
      const generateJwtSpy = jest
        .spyOn(authService, 'generateJwt')
        .mockImplementation(() => {
          throw jwtError;
        });

      await expect(controller.signup(signupBody)).rejects.toThrow(jwtError);
      expect(signupSpy).toHaveBeenCalledWith(signupBody);
      expect(generateJwtSpy).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('signin', () => {
    it('should successfully signin a user and return response DTO', async () => {
      const signinBody = createSigninBody();
      const mockUser = createMockUser();
      const mockToken = 'jwt-token-123';
      const expectedResponse = new AuthResponseDto(
        mockUser.id,
        mockUser.name,
        mockToken,
      );
      const signinSpy = jest
        .spyOn(authService, 'signin')
        .mockResolvedValue(mockUser);
      const generateJwtSpy = jest
        .spyOn(authService, 'generateJwt')
        .mockReturnValue(mockToken);

      const result = await controller.signin(signinBody);

      expect(signinSpy).toHaveBeenCalledWith(signinBody);
      expect(signinSpy).toHaveBeenCalledTimes(1);
      expect(generateJwtSpy).toHaveBeenCalledWith(mockUser);
      expect(generateJwtSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should handle validation error when email is missing', async () => {
      const invalidSigninBody = createSigninBody({ email: undefined });

      await expect(controller.signin(invalidSigninBody)).rejects.toThrow(
        ZodError,
      );
    });
    it('should handle validation error when email is invalid', async () => {
      const invalidSigninBody = createSigninBody({ email: 'invalid-email' });

      await expect(controller.signin(invalidSigninBody)).rejects.toThrow(
        ZodError,
      );
    });
    it('should handle validation error when password is missing', async () => {
      const invalidSigninBody = createSigninBody({ password: undefined });

      await expect(controller.signin(invalidSigninBody)).rejects.toThrow(
        ZodError,
      );
    });
    it('should handle validation error when password is invalid', async () => {
      const invalidSigninBody = createSigninBody({ password: '123' });

      await expect(controller.signin(invalidSigninBody)).rejects.toThrow(
        ZodError,
      );
    });
    it('should handle email with no account error', async () => {
      const signinBody = createSigninBody();
      const error = new Error('invalid credentials');

      const signinSpy = jest
        .spyOn(authService, 'signin')
        .mockRejectedValue(error);
      const generateJwtSpy = jest.spyOn(authService, 'generateJwt');

      await expect(controller.signin(signinBody)).rejects.toThrow(error);
      expect(signinSpy).toHaveBeenCalledWith(signinBody);
      expect(generateJwtSpy).not.toHaveBeenCalled();
    });
    it('should handle wrong password error', async () => {
      const signinBody = createSigninBody();
      const error = new Error('invalid credentials');

      const signinSpy = jest
        .spyOn(authService, 'signin')
        .mockRejectedValue(error);
      const generateJwtSpy = jest.spyOn(authService, 'generateJwt');

      await expect(controller.signin(signinBody)).rejects.toThrow(error);
      expect(signinSpy).toHaveBeenCalledWith(signinBody);
      expect(generateJwtSpy).not.toHaveBeenCalled();
    });

    it('should handle JWT generation errors', async () => {
      const signinBody = createSigninBody();
      const mockUser = createMockUser();
      const jwtError = new Error('JWT generation failed');

      const signinSpy = jest
        .spyOn(authService, 'signin')
        .mockResolvedValue(mockUser);

      const generateJwtSpy = jest
        .spyOn(authService, 'generateJwt')
        .mockImplementation(() => {
          throw jwtError;
        });

      await expect(controller.signin(signinBody)).rejects.toThrow(jwtError);
      expect(signinSpy).toHaveBeenCalledWith(signinBody);
      expect(generateJwtSpy).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('controller definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have authService injected', () => {
      expect(authService).toBeDefined();
    });
  });
});

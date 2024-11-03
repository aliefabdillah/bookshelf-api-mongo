import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let authService: AuthService;
  let authController: AuthController;
  const token = 'jwt-token';

  const mockUser = {
    _id: '61c0ccf11d7bf83d153d7c06',
    name: 'Ghulam',
    email: 'ghulam1@gmail.com',
  };

  const mockAuthService = {
    // mock service method for auth
    signUp: jest.fn().mockResolvedValueOnce({
      statusCode: 201,
      data: mockUser,
      message: 'User Registered successfully',
    }),
    login: jest.fn().mockResolvedValueOnce({ token }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authController = module.get<AuthController>(AuthController);
  });

  // defined controller test
  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('signUp', () => {
    const signUpDto = {
      name: 'test name',
      email: 'test email',
      password: 'test password',
      roles: ['user'],
    };

    it('should be register new user', async () => {
      const result = await authService.signUp(signUpDto);

      // expected signup method has been called
      expect(authService.signUp).toHaveBeenCalled();
      // expected result same as actual result
      expect(result).toEqual({
        statusCode: 201,
        data: mockUser,
        message: 'User Registered successfully',
      });
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'testUser@gmail.com',
      password: 'testPassword',
    };

    it('should be register new user', async () => {
      const result = await authService.login(loginDto);

      // expected login method has been called
      expect(authService.login).toHaveBeenCalled();
      expect(result).toEqual({ token });
    });
  });
});

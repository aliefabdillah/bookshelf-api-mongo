import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let model: Model<User>;
  let jwtService: JwtService;
  const token = 'jwt-token';

  const mockUser = {
    _id: '61c0ccf11d7bf83d153d7c06',
    name: 'Ghulam',
    email: 'ghulam1@gmail.com',
  };

  const mockAuthService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: getModelToken(User.name),
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    model = module.get<Model<User>>(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signUp', () => {
    const signUpDto = {
      name: 'test name',
      email: 'test email',
      password: 'test password',
      roles: ['user'],
    };

    it('should be register new user', async () => {
      // watch mock all dependecies
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPssword');
      jest
        .spyOn(model, 'create')
        .mockImplementationOnce(() => Promise.resolve(mockUser as any));
      jest.spyOn(jwtService, 'sign').mockReturnValue('jwtToken');

      const result = await authService.signUp(signUpDto);

      // expect function called but not use parameter
      expect(bcrypt.hash).toHaveBeenCalled();
      // expect result same as actual response
      expect(result).toEqual({
        statusCode: 201,
        data: mockUser,
        message: 'User Registered successfully',
      });
    });

    it('should throw duplicated email exception', async () => {
      // watch mock create model dependecies
      jest
        .spyOn(model, 'create')
        .mockImplementationOnce(() => Promise.reject({ code: 11000 }));

      // expeted result throw conflict exception
      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'testUser@gmail.com',
      password: 'testPassword',
    };

    it('should login user and return the token data', async () => {
      // watch all mock dependencies
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await authService.login(loginDto);

      // expect result same as actual response
      expect(result).toEqual({
        statuCode: 200,
        data: { token },
        message: 'Login successfully',
      });
    });

    it('should return unauthorized where email invalid', async () => {
      // watch dependcies when return was null
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);

      // expected result was throw unauthorized
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return unauthorized where password invalid', async () => {
      // watch findOne and compare mock dependencies
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

      // expected result was throw unauthorized
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { Book, Category } from './entities/book.entity';
import { getModelToken } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { User } from '../auth/entities/user.entity';
// import { Cache } from 'cache-manager';

describe('BookService', () => {
  let bookService: BookService;
  let model: Model<Book>;
  // let cacheService: Cache;

  const mockBook = {
    _id: '6707cc9e93f6e9a67a788602',
    user: '6707cc9e93f6e9a67a788605',
    title: 'book test 1',
    description: 'test description',
    author: 'test author',
    price: 2000,
    category: Category.ADVENTURE,
  };

  const mockUser = {
    _id: '61c0ccf11d7bf83d153d7c06',
    name: 'Ghulam',
    email: 'ghulam1@gmail.com',
  };

  const mockBookService = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockCacheService = {
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [
        BookService,
        {
          provide: getModelToken(Book.name),
          useValue: mockBookService,
        },
        {
          provide: CloudinaryService,
          useValue: {}, // Provide a mock or empty object for CloudinaryService
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheService, //mock cache service manager
        },
      ],
    }).compile();

    bookService = module.get<BookService>(BookService);
    model = module.get<Model<Book>>(getModelToken(Book.name));
    // cacheService = module.get<Cache>(CACHE_MANAGER);
  });

  describe('findAll', () => {
    it('should return array of books', async () => {
      const query = { page: '1', keyword: 'test' };

      // chaining model find method
      jest.spyOn(model, 'find').mockImplementation(
        () =>
          ({
            limit: () => ({
              // return array of mockbook
              skip: jest.fn().mockResolvedValue([mockBook]),
            }),
          }) as any,
      );

      const result = await bookService.findAll(query);

      // expect find method must be use regex and options query
      expect(model.find).toHaveBeenCalledWith({
        title: {
          $regex: 'test',
          $options: 'i',
        },
      });
      // expected result must be array
      expect(result).toEqual([mockBook]);
    });
  });

  describe('findOne', () => {
    it('should find and return book by id', async () => {
      // Mock the behavior of findById to return mockBook
      jest.spyOn(model, 'findById').mockResolvedValue(mockBook as any);

      const result = await bookService.findOne(mockBook._id);

      // Expect findById to be called with the correct ID
      expect(model.findById).toHaveBeenCalledWith(mockBook._id);
      // Expect the result to match mockBook
      expect(result).toEqual(mockBook);
    });

    it('should return BadRequestException if invalid ID is provided', async () => {
      // initialize invalid id
      const id = 'invalid-id';

      // made false mongo valid id checking
      const isValidObjectIDMock = jest
        .spyOn(mongoose, 'isValidObjectId')
        .mockReturnValue(false);

      // expect result to bad  request exception
      await expect(bookService.findOne(id)).rejects.toThrow(
        BadRequestException,
      );

      // expect isValidObject must be return id
      expect(isValidObjectIDMock).toHaveBeenCalledWith(id);
      isValidObjectIDMock.mockRestore();
    });

    it('should return NotFoundException  if book not found', async () => {
      // watchitng find by id must be return null
      jest.spyOn(model, 'findById').mockResolvedValue(null);

      // expected result must  be throw notfound exception
      await expect(bookService.findOne(mockBook._id)).rejects.toThrow(
        NotFoundException,
      );

      // expected findbyid method must be called parameter id
      expect(model.findById).toHaveBeenCalledWith(mockBook._id);
    });
  });

  describe('create', () => {
    it('should be create and return a book', async () => {
      // initialize book dto
      const createBookDto = {
        title: 'book test 1',
        description: 'test description',
        author: 'test author',
        price: 2000,
        category: Category.CLASSIC,
      };

      // watch create model method and must have mockBook type
      jest
        .spyOn(model, 'create')
        .mockImplementationOnce(() => Promise.resolve(mockBook as any));

      const result = await bookService.create(
        createBookDto as CreateBookDto,
        mockUser as User,
      );

      // Check if cacheManager.del was called to delete cache
      // expect(cacheService.del).toHaveBeenCalledWith('getBooks');
      // expected result must be same of mockBook
      expect(result).toEqual(mockBook);
    });
  });

  describe('update', () => {
    it('should be update and return a book', async () => {
      // initialize book dto
      const updateBookDto = {
        ...mockBook,
        title: 'updated name',
      };

      const book = { title: 'updated name' };

      // watch update model method and must have updatedBookDto type
      jest.spyOn(model, 'findByIdAndUpdate').mockResolvedValue(updateBookDto);

      const result = await bookService.update(mockBook._id, book as any);

      // Check if cacheManager.del was called to delete cache
      // expect(cacheService.del).toHaveBeenCalledWith('getBooks');

      // expect findbyidandupdate include id, book, and query
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(mockBook._id, book, {
        new: true,
        runValidators: true,
      });
      // expected result.title must be same of book.title
      expect(result.title).toEqual(book.title);
    });
  });

  describe('remove', () => {
    it('should be delete and return a book', async () => {
      // watch create model method and must return mockBook type
      jest.spyOn(model, 'findByIdAndDelete').mockResolvedValue(mockBook._id);

      const result = await bookService.remove(mockBook._id);

      // Check if cacheManager.del was called to delete cache
      // expect(cacheService.del).toHaveBeenCalledWith('getBooks');

      // expect findbyidandDelete include id
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(mockBook._id);
      // expected result must be same of mockBook.id
      expect(result).toEqual(mockBook._id);
    });
  });
});

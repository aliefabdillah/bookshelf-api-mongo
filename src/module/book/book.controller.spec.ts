import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { Category } from './entities/book.entity';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { BookController } from './book.controller';
import { PassportModule } from '@nestjs/passport';
import { CreateBookDto } from './dto/create-book.dto';
import { User } from '../auth/entities/user.entity';
import { UpdateBookDto } from './dto/update-book.dto';

describe('BookController', () => {
  let bookService: BookService;
  let bookController: BookController;

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
    findAll: jest.fn().mockResolvedValueOnce([mockBook]), //must be return array  of book,
    create: jest.fn(),
    findOne: jest.fn().mockResolvedValueOnce(mockBook), //must be return single book
    update: jest.fn(),
    remove: jest.fn().mockResolvedValueOnce(mockBook._id),
  };

  const mockCacheService = {
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register(),
        PassportModule.register({ defaultStrategy: 'jwt' }),
      ],
      controllers: [BookController],
      providers: [
        {
          provide: BookService,
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
    bookController = module.get<BookController>(BookController);
  });

  it('should be defined', () => {
    expect(bookController).toBeDefined();
  });

  describe('findAllBooks', () => {
    it('should get all books and return as array books', async () => {
      const result = await bookController.findAllBooks({
        page: '1',
        keyword: 'test',
      });

      // expect bookservice.findall method has been called
      expect(bookService.findAll).toHaveBeenCalled();

      // expect result must be array of mockBook/book
      expect(result).toEqual([mockBook]);
    });
  });

  describe('create', () => {
    const createBookDto = {
      title: 'book test 1',
      description: 'test description',
      author: 'test author',
      price: 2000,
      category: Category.CLASSIC,
    };

    it('should create new books and return as book', async () => {
      mockBookService.create = jest.fn().mockResolvedValueOnce(mockBook);

      const result = await bookController.create(
        createBookDto as CreateBookDto,
        mockUser as User,
      );

      // expect bookservice.findall method has been called
      expect(bookService.create).toHaveBeenCalled();

      // expect result must be new mockBook/book
      expect(result).toEqual(mockBook);
    });
  });

  describe('findOne', () => {
    it('should get a book by id and return as single book', async () => {
      const result = await bookController.findOne(mockBook._id);

      // expect bookservice.findOne method has been called
      expect(bookService.findOne).toHaveBeenCalled();

      // expect result must be single mockBook/book
      expect(result).toEqual(mockBook);
    });
  });

  describe('update', () => {
    const updateBookDto = {
      ...mockBook,
      title: 'updated name',
    };

    it('should update a book by id and return as single book', async () => {
      const book = { title: 'updated name' };

      mockBookService.update = jest.fn().mockResolvedValueOnce(updateBookDto);
      const result = await bookController.update(
        mockBook._id,
        book as UpdateBookDto,
      );
      // expect bookservice.update method has been called
      expect(bookService.update).toHaveBeenCalled();

      // expect result must be updated mockBook/book
      expect(result).toEqual(updateBookDto);
    });
  });

  describe('remove', () => {
    it('should remove a book by id', async () => {
      const result = await bookController.remove(mockBook._id);

      // expect bookservice.remove method has been called
      expect(bookService.remove).toHaveBeenCalled();

      // expect result must be id of book
      expect(result).toEqual(mockBook._id);
    });
  });
});

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Book } from './entities/book.entity';
import mongoose from 'mongoose';
import { Query } from 'express-serve-static-core';
import { User } from '../auth/entities/user.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name) private bookModel: mongoose.Model<Book>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private cloudinaryService: CloudinaryService, //inject cloudinaryService so  we can use in this service
  ) {}

  async create(createBookDto: CreateBookDto, user: User) {
    // assign user id into dto object
    const data = Object.assign(createBookDto, { user: user._id });

    // insert to database
    const bookResult = await this.bookModel.create(data);

    // if new book create delete cache data
    if (bookResult) {
      await this.cacheManager.del('getBooks');
    }
    return bookResult;
  }

  async findAll(query: Query) {
    // pagination
    const perPage = 2;
    const currentPage = Number(query.page) || 1;
    const skip = perPage * (currentPage - 1);

    const keyword = query.keyword
      ? {
          title: {
            $regex: query.keyword,
            $options: 'i',
          },
        }
      : {};
    const books = await this.bookModel
      .find({ ...keyword })
      .limit(perPage)
      .skip(skip);
    return books;
  }

  async findOne(id: string) {
    const isValidId = mongoose.isValidObjectId(id);

    if (!isValidId) {
      throw new BadRequestException('Id is not valid');
    }

    const bookData = await this.bookModel.findById(id);
    if (!bookData) {
      throw new NotFoundException('Book not found');
    }
    return bookData;
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    const isValidId = mongoose.isValidObjectId(id);

    if (!isValidId) {
      throw new BadRequestException('Id is not valid');
    }

    const newBookData = await this.bookModel.findByIdAndUpdate(
      id,
      updateBookDto,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!newBookData) {
      throw new NotFoundException('Book not found');
    }
    // delete cache when book updated
    await this.cacheManager.del('getBooks');
    return newBookData;
  }

  async remove(id: string) {
    const isValidId = mongoose.isValidObjectId(id);

    if (!isValidId) {
      throw new BadRequestException('Id is not valid');
    }

    const removedBook = await this.bookModel.findByIdAndDelete(id);
    if (!removedBook) {
      throw new NotFoundException('Book not found');
    }
    // delete cache when book deleted
    await this.cacheManager.del('getBooks');
    return removedBook;
  }

  async uploadFile(id: string, files: Array<Express.Multer.File>) {
    const bookData = await this.bookModel.findById(id);
    if (!bookData) {
      throw new NotFoundException('Book not found');
    }

    const cloudImages = await Promise.all(
      // upload file using cloudinaryService
      files.map(async (file) => {
        return this.cloudinaryService
          .uploadFiles(file)
          .then((data) => {
            return {
              statusCode: 200,
              url: data.secure_url,
              fileName: data.original_filename,
            };
          })
          .catch(() => {
            return { statusCode: 400, url: '' as any, fileName: '' as any };
          });
      }),
    );

    const imageResult = cloudImages.map((image) => {
      if (image.statusCode === 400) {
        throw new BadRequestException('Failed To Upload Files');
      }
      return {
        url: image.url,
        fileName: image.fileName,
      };
    });

    bookData.images = imageResult;
    await bookData.save();
    return bookData;
  }
}

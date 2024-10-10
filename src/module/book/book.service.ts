import {
  BadRequestException,
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

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name) private bookModel: mongoose.Model<Book>,
  ) {}

  async create(createBookDto: CreateBookDto, user: User) {
    // assign user id into dto object
    const data = Object.assign(createBookDto, { user: user._id });

    // insert to database
    const bookResult = await this.bookModel.create(data);
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
    return removedBook;
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  Put,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Query as ExpressQuery } from 'express-serve-static-core';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post('/new')
  @UseGuards(AuthGuard()) //Guard watching JWT Token strategy
  create(@Body() createBookDto: CreateBookDto, @Req() req) {
    // get user data from logged in user
    return this.bookService.create(createBookDto, req.user);
  }

  // @SkipThrottle() //skip throttle guard
  @Throttle({ default: { limit: 1, ttl: 2000 } }) //custom throtter for certain endpoints
  @Get()
  @Roles(Role.Moderator, Role.Admin, Role.User) //required role
  @UseGuards(AuthGuard(), RolesGuard) //check auth and role
  findAllBooks(@Query() query: ExpressQuery) {
    return this.bookService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookService.findOne(id);
  }

  @Patch('/change/:id')
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.bookService.update(id, updateBookDto);
  }

  @Delete('/remove/:id')
  remove(@Param('id') id: string) {
    return this.bookService.remove(id);
  }

  @Put('upload/:id')
  @UseGuards(AuthGuard()) //to access endpoint must  be authenticated
  @UseInterceptors(FilesInterceptor('files')) //add file interceptor so user can upload files
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles(
      // validator
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png)$/,
        })
        .addMaxSizeValidator({
          maxSize: 1000 * 1000,
          message: 'File size must be less than 1MB',
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    files: Array<Express.Multer.File>,
  ) {
    return this.bookService.uploadFile(id, files);
  }
}

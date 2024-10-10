import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { MongooseModule } from '@nestjs/mongoose';
import forFeatureDb from '../db/for-feature.db';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MongooseModule.forFeature(forFeatureDb), AuthModule],
  controllers: [BookController],
  providers: [BookService],
})
export class BookModule {}

import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

// Module for CloudinaryService
@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}

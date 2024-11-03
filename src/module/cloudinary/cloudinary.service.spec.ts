import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service'; // Adjust the import path accordingly
import { v2 } from 'cloudinary';

jest.mock('cloudinary', () => {
  return {
    v2: {
      config: jest.fn(),
      uploader: {
        upload_stream: jest.fn(),
      },
    },
  };
});

describe('CloudinaryService', () => {
  let cloudinaryService: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryService],
    }).compile();

    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(cloudinaryService).toBeDefined();
  });

  describe('uploadFiles', () => {
    it('should successfully upload a file to Cloudinary', async () => {
      const mockResult = { secure_url: 'http://example.com/image.jpg' };
      const mockUploadStream = jest
        .fn()
        .mockImplementation((options, callback) => {
          callback(null, mockResult);
          return { on: jest.fn() }; // Return a mock stream
        });

      (v2.uploader.upload_stream as jest.Mock).mockImplementation(
        mockUploadStream,
      );

      const fileName = 'upload' as unknown as Express.Multer.File;

      const result = await cloudinaryService.uploadFiles(fileName);

      expect(v2.config).toHaveBeenCalledWith({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
      });

      expect(mockUploadStream).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should throw an error when upload fails', async () => {
      const mockError = new Error('Upload failed');
      const mockUploadStream = jest
        .fn()
        .mockImplementation((options, callback) => {
          callback(mockError, null);
          return { on: jest.fn() }; // Return a mock stream
        });

      (v2.uploader.upload_stream as jest.Mock).mockImplementation(
        mockUploadStream,
      );

      const fileName = 'upload' as unknown as Express.Multer.File;

      await expect(cloudinaryService.uploadFiles(fileName)).rejects.toThrow(
        'Upload failed',
      );
    });
  });
});

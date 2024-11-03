import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import mongoose from 'mongoose';
import { Category } from './../src/module/book/entities/book.entity';

describe('Book & Auth Controller (e2e)', () => {
  let app: INestApplication;
  let token = 'jwt-token';
  let bookCreated;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeAll(() => {
    mongoose.connect(process.env.MONGO_CONN).then(() => {
      mongoose.connection.db.dropDatabase();
    });
  });

  afterAll(() => mongoose.disconnect());

  const user = {
    name: 'user',
    email: 'user@example.com',
    password: 'password',
  };

  const newBook = {
    title: 'Book test',
    description: 'This Is Book test',
    author: 'Author test',
    price: 15000,
    category: Category.ADVENTURE,
  };

  describe('Auth', () => {
    it('/ (POST) - Register a new User', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(user)
        .expect(201);
      expect(res.body).toBeDefined();
    });

    it('/ (POST) - Login User', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(201);
      expect(res.body.data.token).toBeDefined();
      token = res.body.data.token;
    });
  });

  describe('Book', () => {
    it('/ (POST) - Create a new book', async () => {
      const res = await request(app.getHttpServer())
        .post('/books/new')
        .set('Authorization', 'Bearer ' + token)
        .send(newBook)
        .expect(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toEqual(newBook.title);
      bookCreated = res.body;
    });

    it('/ (GET) - Get all books', async () => {
      const res = await request(app.getHttpServer())
        .get('/books')
        .set('Authorization', 'Bearer ' + token)
        .expect(200);
      expect(res.body.length).toBe(1);
    });

    it('/ (GET) - Get book id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/books/${bookCreated?._id}`)
        .set('Authorization', 'Bearer ' + token)
        .expect(200);
      expect(res.body).toBeDefined();
      expect(res.body._id).toEqual(bookCreated?._id);
    });

    it('/ (PATCH) - update book by id', async () => {
      const book = { title: 'updated title' };
      const res = await request(app.getHttpServer())
        .patch(`/books/change/${bookCreated?._id}`)
        .send(book)
        .expect(200);
      expect(res.body).toBeDefined();
      expect(res.body.title).toEqual(book.title);
    });

    it('/ (DELETE) - delete book by id', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/books/remove/${bookCreated?._id}`)
        .expect(200);
      expect(res.body).toBeDefined();
      expect(res.body._id).toEqual(bookCreated?._id);
    });
  });
});

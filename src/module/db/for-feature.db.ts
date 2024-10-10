import { UserSchema } from '../auth/entities/user.entity';
import { BookSchema } from '../book/entities/book.entity';

export default [
  { name: 'Book', schema: BookSchema },
  { name: 'User', schema: UserSchema },
];

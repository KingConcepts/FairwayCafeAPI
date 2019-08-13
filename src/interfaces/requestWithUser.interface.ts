import { Request } from 'express';
import User from 'users/user.interface';

interface RequestWithUser extends Request {
  headers: Request.headers;
  body: Request.body;
  user: User;
  isAdmin: Boolean;
}

export default RequestWithUser;

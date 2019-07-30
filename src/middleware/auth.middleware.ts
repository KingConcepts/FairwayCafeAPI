import { NextFunction, Response } from 'express';

import AuthenticationTokenMissingException from '../exceptions/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exceptions/WrongAuthenticationTokenException';
import DataStoredInToken from '../interfaces/dataStoredInToken';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import userModel from '../user/user.model';
import authentication from '../utils/authentication';

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['authorization'];
  if (token) {
    try {
      const verificationResponse: any = await authentication.verifyToken(token);
      console.log('verificationResponse', verificationResponse);
      const user = await userModel.findById(verificationResponse.data.id);
      if (user) {
        // req.user = user;
        next();
      } else {
        return res.json({
          status: 401,
          message: 'Invalid token',
          data: null
        });
      }
    } catch (error) {
      return res.json({
        status: 401,
        message: 'Invalid token',
        data: null
      });
      // next(new WrongAuthenticationTokenException());
    }
  } else {
    // next(new AuthenticationTokenMissingException());
    return res.json({
      status: 401,
      message: 'Invalid token',
      data: null
    });
  }
}

export default authMiddleware;

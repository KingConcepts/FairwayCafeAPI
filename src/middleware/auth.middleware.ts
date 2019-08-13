import { NextFunction, Response } from 'express';

import AuthenticationTokenMissingException from '../exception/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exception/WrongAuthenticationTokenException';
import DataStoredInToken from '../interfaces/dataStoredInToken';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import userModel from '../user/user.model';
import userTokenModel from '../authentication/userToken.model';
import authentication from '../utils/authentication';
import ResponseBase from '../response/response.controller';
import IDataStoredInToken from '../interfaces/dataStoredInToken';

async function authMiddleware(req: RequestWithUser, res: Response, next: NextFunction) {
  const responseBase = new ResponseBase();
  try {
    const token = req.headers['authorization'];
    const tokenExpirationTime: number = Number(process.env.TOKEN_EXP_TIME);
    if (token) {
      const verificationResponse: any = await authentication.verifyToken(token);
      // console.log('verificationResponse', verificationResponse);

      /** Token should expire after 48 hours of inactivity
       *  calculating 1 month hours from now
       */
      const currentTime: number = new Date().getTime();
      const timeToExpire = (currentTime - tokenExpirationTime);
      const userToken = await userTokenModel.findOne({ token, status: 'Active' });
      if (userToken && verificationResponse) {
        const updatedAt: number = new Date(userToken.updatedAt).getTime();
        if (updatedAt < timeToExpire) {
          await userTokenModel.findOneAndUpdate({ token }, { status: 'Inactive' });
          responseBase.invalidToken(res);

        } else {
          await userTokenModel.findOneAndUpdate({ token }, { status: 'Active' });
          const user = await userModel.findById(verificationResponse.data.id, { 'companyCode2': 1, 'status': 1 });
          if (user) {
            if ((user.companyCode2 === 'CGC' || user.companyCode2 === 'CGI' || user.companyCode2 === 'CGS')
              && (user.status === '3')) {
              req.user = user;
              // req.isAdmin = true;
              next();
            } else {
              await userTokenModel.findOneAndUpdate({ token }, { status: 'Inactive' });
              responseBase.invalidToken(res);
            }
          } else {
            await userTokenModel.findOneAndUpdate({ token }, { status: 'Inactive' });
            responseBase.invalidToken(res);
          }
        }
      } else {
        responseBase.invalidToken(res);
      }
    } else {
      responseBase.invalidToken(res);
    }
  } catch (err) {
    console.log(err);
    responseBase.invalidToken(res);
  }
}


export default authMiddleware;

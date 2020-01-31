import * as express from 'express';

import RequestWithUser from '../interfaces/requestWithUser.interface';
import userTokenModel from './userToken.model';
import userModel from '../user/user.model';
import bycryptOprations from '../utils/bcryptOperations';
import authentication from '../utils/authentication';
import RequestBase from '../response/response.controller';
import CartController from '../cart/cart.controller';
import notification from '../utils/notification';
import { userRegister } from '../templates/template';

import {
  IUserData,
  IResponse
} from '../interfaces/response.interface'

class Authentication extends RequestBase {
  public path = '/users';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`/api/signup`, this.registration);
    this.router.post(`/api/login`, this.login);
    this.router.post(`/api/logout/:id`, this.logout);
  }

  private registration = async (req: RequestWithUser, res: express.Response) => {
    try {
      //@TODO .toLowerCase() to email here and also while saving
      const getQueryParams = { email: req.body.email, empNumber: req.body.empNumber };

      const userDetails = {
        'companyCode2': 1,
        'status': 1,
        'email': 1,
        'firstName': 1,
        'lastName': 1,
        'isRegistered': 1,
        'empNumber': 1
      }
      const user = await userModel.findOne(getQueryParams, userDetails);
      if (!user) {
        return this.sendBadRequest(res, 'Email or EmpNumber is not correct');
      }

      if (user.isRegistered) {
        return this.sendBadRequest(res, 'User Already Registered');
      }

      const userDupCheck = await userModel.find({ username: req.body.username });
      if (userDupCheck.length) {
        return this.sendBadRequest(res, 'Username already taken, Please choose another username');
      }

      const isPasswordValidate = authentication.validatePassword(req.body.password);

      if (!isPasswordValidate) {
        return this.sendBadRequest(res, 'Password should have atleast 6 character');
      }

      if ((user.companyCode2 === 'CGC' || user.companyCode2 === 'CGI' || user.companyCode2 === 'CGS')
        && (user.status === '3')) {
        const updateParams = {
          isRegistered: true,
          password: await bycryptOprations.genratePasswordHash(req.body.password),
          username: req.body.username.toLowerCase()
        }
        await userModel.updateOne({ _id: user._id }, updateParams);
        const token = await authentication.genratetoken(user._id);
        const insertUpdateQuery = {
          token,
          status: 'Active',
          userId: user._id
        };
        await userTokenModel.findOneAndUpdate({ _id: user._id }, insertUpdateQuery, { upsert: true, new: true });
        delete user._doc.status;
        delete user._doc.isRegistered;
        const resData: IUserData = {
          ...user._doc,
          token,
          username: req.body.username,
          company: user._doc.email
        };
        notification.sendEmailNotifications(userRegister, { to: user.email, firstName: user.firstName, subject: 'Welcome to FairwayCafe' });
        const resObj: IResponse = {
          res: res,
          status: 201,
          message: 'User Registered Successfully',
          data: {
            user: resData,
            cart: {}
          }
        }
        this.send(resObj);
      } else {
        this.sendBadRequest(res, 'Invalid user details');
      }
    } catch (e) {
      console.log('registration', e);
      this.sendServerError(res, e.message);
    }
  }

  private login = async (req: express.Request, res: express.Response) => {
    try {
      const getQueryParams = { username: req.body.username.toLowerCase(), isRegistered: true };
      const userDetails = {
        'password': 1,
        'companyCode2': 1,
        'status': 1,
        'email': 1,
        'firstName': 1,
        'lastName': 1,
        'username': 1,
        'empNumber': 1
      }
      const user = await userModel.findOne(getQueryParams, userDetails);
      if (!user) {
        this.sendNotAuthorized(res);
      }
      if ((user.companyCode2 === 'CGC' || user.companyCode2 === 'CGI' || user.companyCode2 === 'CGS')
        && (user.status === '3')) {
        const isPasswordMatched = await bycryptOprations.comparePassword(req.body.password, user.password);
        if (isPasswordMatched) {
          const token = await authentication.genratetoken(user._id);
          const insertUpdateQuery = {
            token,
            status: 'Active',
            userId: user._id
          };
          await userTokenModel.findOneAndUpdate({ _id: user._id }, insertUpdateQuery, { upsert: true, new: true });
          delete user._doc.status;
          delete user._doc.password;
          const resData: IUserData = {
            ...user._doc,
            token,
            company: user._doc.email
          };

          /** Getting user cart details */
          const cartController = new CartController();
          const cartDetails = await cartController.getCartData(user._id);
          const resObj: IResponse = {
            res: res,
            status: 200,
            message: 'Loggedin Successfully',
            data: {
              user: resData,
              cart: cartDetails
            }
          }
          this.send(resObj);
        } else {
          this.sendNotAuthorized(res);
        }
      } else {
        this.sendBadRequest(res, 'Invalid user details');
      }

    } catch (e) {
      console.log('login', e);
      this.sendServerError(res, e.message);
    }
  }

  private logout = async (req: express.Request, res: express.Response) => {
    try {
      if (!req.params.id) {
        return this.sendBadRequest(res, 'Invalid user details');
      }
      await userTokenModel.findOneAndUpdate({ _id: req.params.id }, { status: 'Inactive' });
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Loggedout Successfully',
        data: {}
      }
      this.send(resObj);
    } catch (e) {
      console.log('logout', e);
      this.sendServerError(res, e.message);
    }
  }
}

export default Authentication;

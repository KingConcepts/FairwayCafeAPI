import * as express from 'express';

import adminModel from './admin.model';
import userTokenModel from '../authentication/userToken.model';
import bycryptOprations from '../utils/bcryptOperations';
import { IResponse } from 'interfaces/response.interface';
import RequestBase from '../response/response.controller';
import authentication from '../utils/authentication';
import TaxController from '../settings/tax/tax.controller';
import authMiddleware from '../middleware/auth.middleware';

class AdminController extends RequestBase {
  public path = '/api/admin';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/change_password`, authMiddleware, this.changePassword);
    this.router.post(`${this.path}/login`, this.login);
    this.router.post(`${this.path}/forgot_password`, this.forgotPassword);
    this.router.post(`${this.path}/verify_forgot_password`, this.verifyForgotPassword);
  }

  private changePassword = async (req: express.Request, res: express.Response) => {
    try {
      const user = await adminModel.findOne({ _id: req.body.id }, { 'password': 1 });
      const isPasswordMatched = await bycryptOprations.comparePassword(req.body.oldPassword, user.password);
      if (isPasswordMatched) {
        const isPasswordValidate = authentication.validatePassword(req.body.password);

        if (!isPasswordValidate) {
          return this.sendBadRequest(res, 'Password should a 8-character length with at least 1 alphabet and 1 number');
        }
        const updateParams = {
          password: await bycryptOprations.genratePasswordHash(req.body.password)
        }
        await adminModel.updateOne({ _id: user._id }, updateParams);
        await userTokenModel.findOneAndUpdate({ _id: req.body.id }, { status: 'Inactive' });
        const resObj: IResponse = {
          res: res,
          status: 201,
          message: 'Password Changed Successfully',
          data: {}
        }
        this.send(resObj);
      } else {
        this.sendBadRequest(res, 'Old Password Is Incorrect');
      }
    } catch (e) {
      console.log('changePassword', e);
      this.sendServerError(res, e.message);
    }
  }

  private login = async (req: express.Request, res: express.Response) => {
    try {
      const getQueryParams = { email: req.body.email.toLowerCase() };

      const user = await adminModel.findOne(getQueryParams);
      console.log('user', user);
      const taxController = new TaxController();
      const tax = await taxController.getTaxValue();

      if (!user) {
        this.sendNotAuthorized(res);
      }
      const isPasswordMatched = await bycryptOprations.comparePassword(req.body.password, user.password);
      console.log('isPasswordMatched', isPasswordMatched);
      if (isPasswordMatched) {
        const token = await authentication.genrateAdminToken(user._id);
        const insertUpdateQuery = {
          token,
          status: 'Active',
          userId: user._id,
          isAdmin: true
        };
        await userTokenModel.findOneAndUpdate({ _id: user._id }, insertUpdateQuery, { upsert: true, new: true });
        delete user._doc.status;
        delete user._doc.password;
        const resData: any = {
          ...user._doc,
          token,
          settings: {
            tax
          }
        };

        const resObj: IResponse = {
          res: res,
          status: 200,
          message: 'Loggedin Successfully',
          data: resData
        }
        this.send(resObj);
      } else {
        this.sendNotAuthorized(res);
      }

    } catch (e) {
      console.log('login', e);
      this.sendServerError(res, e.message);
    }
  }

  private forgotPassword = async (req: express.Request, res: express.Response) => {
    try {
      const user = await adminModel.findOne({ email: req.body.email.toLowerCase() });
      if (!user) {
        return this.sendBadRequest(res, 'User Not Available, Please Sign Up.');
      }

      // const randomPassword = 'fairway@123';
      const randomPassword = authentication.generateRandomString();
      console.log('randomPassword', randomPassword);
      const updateParams = {
        password: await bycryptOprations.genratePasswordHash(randomPassword)
      }
      await adminModel.updateOne({ _id: user._id }, updateParams);

      /** Send Email */

      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Password sent Successfully',
        data: req.body
      }
      this.send(resObj);
    } catch (e) {
      console.log('forgotPassword', e);
      this.sendServerError(res, e.message);
    }
  }

  /** Not in use */
  private verifyForgotPassword = async (req: express.Request, res: express.Response) => {
    try {
      const user = await adminModel.findOne({ username: req.body.username });
      if (!user) {
        return this.sendBadRequest(res, 'User Not Available, Please Sign Up.');
      }
      const token = await authentication.verifyToken(user._id);
      const verificationResponse: any = await authentication.verifyToken(token);

      if (verificationResponse.data.isAdmin && verificationResponse.data.id == user._id) {

        const isPasswordValidate = authentication.validatePassword(req.body.password);

        if (!isPasswordValidate) {
          return this.sendBadRequest(res, 'Password should a 8-character length with at least 1 alphabet and 1 number');
        }
        const updateParams = {
          password: await bycryptOprations.genratePasswordHash(req.body.password)
        }
        await adminModel.updateOne({ _id: user._id }, updateParams);
      } else {
        return this.sendBadRequest(res, 'Verification link has been expired');
      }
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Verification link verifed Successfully',
        data: {}
      }
      this.send(resObj);

    } catch (e) {
      console.log('changePassword', e);
      this.sendServerError(res, e.message);
    }
  }
}

export default AdminController;

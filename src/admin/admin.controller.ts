import * as express from 'express';

import userModel from './admin.model';
import userTokenModel from '../authentication/userToken.model';
import bycryptOprations from '../utils/bcryptOperations';
import { IResponse } from 'interfaces/response.interface';
import RequestBase from '../response/response.controller';
import authentication from '../utils/authentication';

class AdminController extends RequestBase {
  public path = '/api/admin';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/change_password`, this.changePassword);
    this.router.post(`${this.path}/login`, this.login);
  }

  private changePassword = async (req: express.Request, res: express.Response) => {
    try {
      const user = await userModel.findOne({ _id: req.body.id }, { 'password': 1 });
      const isPasswordMatched = await bycryptOprations.comparePassword(req.body.oldPassword, user.password);
      if (isPasswordMatched) {
        const updateParams = {
          password: await bycryptOprations.genratePasswordHash(req.body.password)
        }
        await userModel.updateOne({ _id: user._id }, updateParams);
        await userTokenModel.findOneAndUpdate({ _id: req.body.id }, { status: 'Inactive' });
        const resObj: IResponse = {
          res: res,
          status: 201,
          message: 'Password Changed Successfully',
          data: {}
        }
        this.send(resObj);
      } else {
        return this.sendBadRequest(res, 'Old Password Is Incorrect');
      }
    } catch (e) {
      console.log('changePassword', e);
      res.json({
        status: 500,
        message: 'Some error occured',
        data: e.message
      });
    }
  }

  private login = async (req: express.Request, res: express.Response) => {
    try {
      const getQueryParams = { username: req.body.username.toLowerCase()};
      
      const user = await userModel.findOne(getQueryParams);
      if (!user) {
        this.sendNotAuthorized(res);
      }
        const isPasswordMatched = await bycryptOprations.comparePassword(req.body.password, user.password);
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
}

export default AdminController;

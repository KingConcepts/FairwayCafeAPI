import * as express from 'express';

import userModel from './user.model';
import userTokenModel from '../authentication/userToken.model';
import bycryptOprations from '../utils/bcryptOperations';
import { IResponse } from 'interfaces/response.interface';
import RequestBase from '../response/response.controller';

class UserController extends RequestBase {
  public path = '/api/user';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/change_password`, this.changePassword);
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
        this.sendBadRequest(res, 'Old Password Is Incorrect');
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
}

export default UserController;

import * as express from 'express';
// import NotAuthorizedException from '../exceptions/NotAuthorizedException';
import Controller from '../interfaces/controller.interface';
// import RequestWithUser from '../interfaces/requestWithUser.interface';
// import authMiddleware from '../middleware/auth.middleware';
// import postModel from '../post/post.model';
import userModel from './user.model';
import bycryptOprations from '../utils/bcryptOperations';

class UserController implements Controller {
  public path = '/users';
  public router = express.Router();
  // private post = postModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, this.register);
  }

  private register = async (req: express.Request, res: express.Response) => {
    try {
      console.log(req.body);
      const getQueryParams = { email: req.body.email, empNumber: req.body.empCode };
      const user = await userModel.findOne(getQueryParams, {'companyCode2':1, 'status':1});
      console.log(user);
      if ((user.companyCode2 === 'CGC' || user.companyCode2 === 'CGI' || user.companyCode2 === 'CGS')
        && (user.status === '3')) {
          const updateParams = {
            isRegistered: true,
            password: await bycryptOprations.genratePasswordHash(req.body.password)
          }
          const result = await userModel.updateOne({_id: user._id}, updateParams);
          console.log('result', result);
          res.json({
            status: 201,
            message: 'User registerd successfully',
            data: req.body
          });
      } else {
        res.json({
          status: 400,
          message: 'Invalid user details',
          data: null
        });
      }
    } catch (e) {
      console.log('register', e);
      res.json({
        status: 500,
        message: 'Some error occured',
        data: e.message
      });
    }
  }
}

export default UserController;

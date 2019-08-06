import * as express from 'express';
import RequestBase from '../../response/response.controller';
// import Controller from '../interfaces/controller.interface';
import ICategory from './category.interface';
import categoryModel from './category.model';
import authMiddleware from '../../middleware/auth.middleware';
import {
  IUserData,
  IResponse
} from '../../interfaces/response.interface'
class CategoryController extends RequestBase{
  public path = '/menu';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/categories`, authMiddleware, this.getAllCategory);
    // this.router.get(`${this.path}/:id`, this.getPostById);
    // this.router.put(`${this.path}/:id`, this.modifyPost);
    // this.router.delete(`${this.path}/:id`, this.deletePost);
  }

  private getAllCategory = async (req: express.Request, res: express.Response) => {
    try {
      const categories = await categoryModel.find();
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Category Loaded Successfully',
        data: categories
      }
      this.send(resObj);
    } catch (e) {
      console.log('getAllCategory', e);
      this.sendServerError(res, e.message);
    }

  }

  // private saveCategory = async (req: express.Request, res: express.Response) => {
  //   try {
  //     const categories = await categoryModel.find();
  //     const resObj: IResponse = {
  //       res: res,
  //       status: 200,
  //       message: 'Category Loaded Successfully',
  //       data: categories
  //     }
  //     this.send(resObj);
  //   } catch (e) {
  //     console.log('getAllCategory', e);
  //     this.sendServerError(res, e.message);
  //   }

  // }


}

export default CategoryController;
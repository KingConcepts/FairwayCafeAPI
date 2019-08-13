import * as express from 'express';

import RequestBase from '../../response/response.controller';
import categoryModel from './category.model';
import authMiddleware from '../../middleware/auth.middleware';
import { IResponse } from '../../interfaces/response.interface';

class CategoryController extends RequestBase {
  public path = '/api/menu';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/categories`, authMiddleware, this.getAllCategory);
  }

  private getAllCategory = async (req: express.Request, res: express.Response) => {
    try {
      let queryParams: any = {};
      
      if(!req.isAdmin) {
        queryParams.status = true;
      }
      const categories = await categoryModel.find(queryParams);
      
      categories.map((category) => {
        return category.imageURL = category.imageURL ? `${process.env.IMAGE_LOCATION}${category.imageURL}` : process.env.DEFAULT_IMAGE;
      });
      
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
}

export default CategoryController;
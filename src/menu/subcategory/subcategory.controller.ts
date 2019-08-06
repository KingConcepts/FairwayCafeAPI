import * as express from 'express';
import * as mongoose from 'mongoose';
import RequestBase from '../../response/response.controller';
// import Controller from '../interfaces/controller.interface';
import subcategoryModel from './subcategory.model';
import authMiddleware from '../../middleware/auth.middleware';
import {
  IResponse
} from '../../interfaces/response.interface';

class SubcategoryController extends RequestBase {
  public path = '/menu';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:categoryId/subcategories`, authMiddleware, this.getAllSubcategoryWithItems);
    // this.router.get(`${this.path}/:id`, this.getPostById);
    // this.router.put(`${this.path}/:id`, this.modifyPost);
    // this.router.delete(`${this.path}/:id`, this.deletePost);
  }

  private getAllSubcategoryWithItems = async (req: express.Request, res: express.Response) => {
    try {
      const result = await subcategoryModel.aggregate([
        {"$match": {"categoryId": mongoose.Types.ObjectId(req.params.categoryId) }},
        
        /** Category array in listing subcategory with item */
        // {
        //   "$lookup":
        //   {
        //     "from": 'categories',
        //     "localField": 'categoryId',
        //     "foreignField": '_id',
        //     "as": 'category'
        //   }
        // },
        {
          "$lookup":
          {
            "from": 'items',
            "localField": '_id',
            "foreignField": 'subcategoryId',
            "as": 'items'
          }
        },
      ]);
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Subcategory Loaded Successfully',
        data: result
      }
      this.send(resObj);
    } catch (e) {
      console.log('getAllCategory', e);
      this.sendServerError(res, e.message);
    }

  }
}
export default SubcategoryController;

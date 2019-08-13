import * as express from 'express';
import * as mongoose from 'mongoose';

import RequestBase from '../../response/response.controller';
import subcategoryModel from './subcategory.model';
import authMiddleware from '../../middleware/auth.middleware';
import { IResponse } from '../../interfaces/response.interface';

class SubcategoryController extends RequestBase {
  public path = '/api/menu';
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
      let queryParams: any = {};
      let itemQuery : any = {};
      if (!req.isAdmin) {
        queryParams.status = true;
        queryParams.categoryId = mongoose.Types.ObjectId(req.params.categoryId);
        itemQuery.status = true;
      } else {
        queryParams.categoryId = mongoose.Types.ObjectId(req.params.categoryId);
      }
      const result = await subcategoryModel.aggregate([
        { "$match": queryParams },

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
            // "localField": '_id',
            // "foreignField": 'subcategoryId',
            "let": { "id": "$subcategoryId" },
            "as": 'items',
            "pipeline": [{ "$match": itemQuery }]
          }
        },
      ]);
      result.map((subcategory) => {
        subcategory.imageURL = subcategory.imageURL ? `${process.env.IMAGE_LOCATION}${subcategory.imageURL}` : process.env.DEFAULT_IMAGE;
        return subcategory.items.map((item) => {
          item.imageURL = item.imageURL ? `${process.env.IMAGE_LOCATION}${item.imageURL}` : process.env.DEFAULT_IMAGE;
        })
      });
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

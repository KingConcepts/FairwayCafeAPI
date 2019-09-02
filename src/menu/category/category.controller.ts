import * as express from 'express';

import RequestBase from '../../response/response.controller';
import categoryModel from './category.model';
import authMiddleware from '../../middleware/auth.middleware';
import { IResponse } from '../../interfaces/response.interface';
import fileUploads from '../../utils/fileUploads';
import adminMiddleware from '../../middleware/admin.middleware';

class CategoryController extends RequestBase {

  public path = '/api/menu';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/categories`, authMiddleware, this.getAllCategory);
    this.router.post(`${this.path}/categories`, authMiddleware, adminMiddleware, fileUploads.uploadFile().single('image'), this.createCategory);
    this.router.get(`${this.path}/categories/:id`, authMiddleware, this.getCategory);
    this.router.put(`${this.path}/categories/:id`, authMiddleware, adminMiddleware, fileUploads.uploadFile().single('image'), this.updateCategory);
  }

  private getAllCategory = async (req: express.Request, res: express.Response) => {
    try {
      let queryParams: any = {};
      let categories: any;

      if (!req.isAdmin) {
        queryParams.status = true;
      }
      const page = req.query.page ? req.query.page : 0;
      const limit = page ? Number(req.query.limit) || Number(process.env.PAGE_LIMIT) : 1000;
      const skip = page ? Number((page - 1) * limit) : 0;
      
      if (req.query.keyword) {
        categories = await categoryModel.aggregate([
          { $match: { name: new RegExp(`${req.query.keyword}`, 'i') } },
          { $skip: skip },
          { $limit: limit }
        ]);
      } else {
        categories = await categoryModel.find(queryParams).skip(skip).limit(limit);
      }

      categories.map((category) => {
        return category.imageURL = category.imageURL ? `${process.env.IMAGE_LOCATION}${category.imageURL}` : process.env.DEFAULT_IMAGE;
      });

      let categoryRes;

      const pageCount = page ? categories.length / limit : 0;
      const totalPage = page ? (pageCount % 1 ? Math.floor(pageCount) + 1 : pageCount) : 0;

      if (!req.isAdmin) {
        categoryRes = categories;
      } else {
        categoryRes = {
          categories,
          totalPage,
          categoriesCount: categories.length,
          page: Number(page)
        }
      }

      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Categories Loaded Successfully',
        data: categoryRes
      }
      this.send(resObj);
    } catch (e) {
      console.log('getAllCategory', e);
      this.sendServerError(res, e.message);
    }
  }

  private createCategory = async (req: express.Request, res: express.Response) => {
    try {
      if (!req.body.name) {
        return this.sendBadRequest(res, 'Category Name Is Required.');
      }
      const catData = await categoryModel.findOne({ name: req.body.name });
      
      if (catData) {
        return this.sendBadRequest(res, 'Category Name Is Already Available.');
      }
      const saveQueryParams = {
        name: req.body.name,
        description: req.body.description || '',
        imageURL: req.file && req.file.filename || '',
      };
      const createdData = await new categoryModel(saveQueryParams);
      const result = await createdData.save();
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Category Added Successfully',
        data: result
      }
      this.send(resObj);
    } catch (e) {
      console.log('createCategory', e);
      this.sendServerError(res, e.message);
    }
  }

  private getCategory = async (req: express.Request, res: express.Response) => {
    try {
      let queryParams: any = {};

      if (!req.isAdmin) {
        queryParams.status = true;
        queryParams._id = req.params.id;
      } else {
        queryParams._id = req.params.id;
      }
      const category = await categoryModel.findOne(queryParams);

      category.imageURL = category.imageURL ? `${process.env.IMAGE_LOCATION}${category.imageURL}` : process.env.DEFAULT_IMAGE;

      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Category Loaded Successfully',
        data: category
      }
      this.send(resObj);
    } catch (e) {
      console.log('getAllCategory', e);
      this.sendServerError(res, e.message);
    }
  }

  private updateCategory = async (req: express.Request, res: express.Response) => {
    try {
      if (!req.body.name) {
        return this.sendBadRequest(res, 'Category Name Is Required.');
      }
      const catData = await categoryModel.findOne({ name: req.body.name });
      
      if (JSON.stringify(catData._id) !== JSON.stringify(req.params.id)) {
        return this.sendBadRequest(res, 'Category Name Is Already Available.');
      }
      // const saveQueryParams = {
      //   name: req.body.name,
      //   description: req.body.description,
      //   status: req.body.status,
      //   imageURL: req.file && req.file.filename || ''
      // };
      const saveQueryParams = {
        ...req.body,
      };

      if (req.file && req.file.filename) {
        saveQueryParams.imageURL = req.file.filename;
      }
      const result = await categoryModel.findOneAndUpdate({ _id: req.params.id }, saveQueryParams);

      const resObj: IResponse = {
        res: res,
        status: 201,
        message: 'Category updated Successfully',
        data: saveQueryParams
      }
      this.send(resObj);
    } catch (e) {
      console.log('updateCategory', e);
      this.sendServerError(res, e.message);
    }
  }
}

export default CategoryController;
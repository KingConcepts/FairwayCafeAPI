import * as express from 'express';

import RequestBase from '../../response/response.controller';
import categoryModel from './category.model';
import authMiddleware from '../../middleware/auth.middleware';
import { IResponse } from '../../interfaces/response.interface';
import fileUploads from '../../utils/fileUploads';
import adminMiddleware from '../../middleware/admin.middleware';
import subcategoryModel from '../../menu/subcategory/subcategory.model';

class CategoryController extends RequestBase {

  public path = '/api/menu';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/categories/all`, authMiddleware, this.getAllCategoryForDropdown);
    this.router.get(`${this.path}/categories`, authMiddleware, this.getAllCategory);
    this.router.post(`${this.path}/categories`, authMiddleware, adminMiddleware, fileUploads.uploadFile().single('image'), this.createCategory);
    this.router.get(`${this.path}/categories/:id`, authMiddleware, this.getCategory);
    this.router.put(`${this.path}/categories/:id`, authMiddleware, adminMiddleware, fileUploads.uploadFile().single('image'), this.updateCategory);
    this.router.delete(`${this.path}/categories/:id`, authMiddleware, adminMiddleware, this.deleteCategory);
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
        queryParams.name = new RegExp(`${req.query.keyword}`, 'i')
      }

      const categoriesCount = await categoryModel.count(queryParams);
      categories = await categoryModel.aggregate([
        { $match: queryParams },
        { $skip: skip },
        { $limit: limit },
        { $sort: { updatedAt: -1 } },
      ]);

      categories.map((category) => {
        return category.imageURL = category.imageURL ? `${process.env.IMAGE_LOCATION}${category.imageURL}` : process.env.DEFAULT_IMAGE;
      });

      let categoryRes;

      const pageCount = page ? categoriesCount / limit : 0;
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
      if (!category) {
        return this.sendBadRequest(res, 'Category Is Not Availabale.');
      }
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

      const catData = await categoryModel.findOne({ name: req.body.name });

      if (catData && JSON.stringify(catData._id) !== JSON.stringify(req.params.id)) {
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

  private deleteCategory = async (req: express.Request, res: express.Response) => {
    try {
      const items = await subcategoryModel.find({ categoryId: req.params.id });

      if (items.length) {
        return this.sendBadRequest(res, 'You can not remove Category, Subcategories are still available with this category.');
      }
      await categoryModel.remove({ _id: req.params.id });

      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Category deleted Successfully.',
        data: {}
      }
      this.send(resObj);
    } catch (e) {
      console.log('deleteCategory', e);
      this.sendServerError(res, e.message);
    }
  }

  private getAllCategoryForDropdown = async (req: express.Request, res: express.Response) => {
    try {
      let queryParams: any = {};
      if (req.query.status && req.query.status !== 'null') {
        queryParams.status = req.query.status;
      }
      const categories = await categoryModel.find(queryParams, {name: 1});

      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Categories Loaded Successfully',
        data: categories
      }
      this.send(resObj);
    } catch (e) {
      console.log('getAllCategoryForDropdown', e);
      this.sendServerError(res, e.message);
    }
  }
}

export default CategoryController;
import * as express from 'express';
import * as mongoose from 'mongoose';

import RequestBase from '../../response/response.controller';
import itemModel from './item.model';
import subcategoryModel from './../subcategory/subcategory.model';
import categoryModel from './../category/category.model';
import authMiddleware from '../../middleware/auth.middleware';
import {
  IResponse,
  IItemData
} from '../../interfaces/response.interface';
import adminMiddleware from '../../middleware/admin.middleware';
import fileUploads from '../../utils/fileUploads';

class ItemController extends RequestBase {
  public path = '/api/menu';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/items/:id`, authMiddleware, this.getItem);
    this.router.post(`${this.path}/items`, authMiddleware, adminMiddleware, fileUploads.uploadFile().single('image'), this.createItem);
    this.router.get(`${this.path}/:subcategoryId/items`, authMiddleware, this.getAllItems);
    this.router.put(`${this.path}/items/:id`, authMiddleware, adminMiddleware, fileUploads.uploadFile().single('image'), this.updateItem);
  }

  private getAllItems = async (req: express.Request, res: express.Response) => {
    try {
      let queryParams: any = {};
      let items: any = [];
      queryParams.subcategoryId = mongoose.Types.ObjectId(req.params.subcategoryId);
      const page = req.query.page ? req.query.page : 0;
      const itemsCount = await itemModel.count();
      const limit = page ? Number(req.query.limit) || Number(process.env.PAGE_LIMIT) : 1000;
      const skip = page ? Number((page - 1) * limit) : 0;
      const pageCount = page ? itemsCount / limit : 0;
      const totalPage = page ? (pageCount % 1 ? Math.floor(pageCount) + 1 : pageCount) : 0;
      if (!req.isAdmin) {
        queryParams.status = true;
        items = await itemModel.find(queryParams).skip(skip).limit(limit);
      } else {
        if (req.query.keyword) {
          items = await itemModel.aggregate([
            { $match: { name: new RegExp(`${req.query.keyword}`, 'i') } },
            { $skip: skip },
            { $limit: limit },
          ]);
        } else {
          items = await itemModel.find(queryParams).skip(skip).limit(limit);
        }
      }

      if (!items.length) {
        return this.sendBadRequest(res, 'Items Are Not Availabale.');
      }
      // const subcategory = item ? await subcategoryModel.findOne({ _id: mongoose.Types.ObjectId(item.subcategoryId) }) : '';
      // const category = subcategory ? await categoryModel.findOne({ _id: subcategory.categoryId }) : '';
      items.map((item) => {
        return item.imageURL = item.imageURL ? `${process.env.IMAGE_LOCATION}${item.imageURL}` : process.env.DEFAULT_IMAGE;
      });
      // subcategory.imageURL = subcategory.imageURL ? `${process.env.IMAGE_LOCATION}${subcategory.imageURL}` : process.env.DEFAULT_IMAGE;
      // category.imageURL = category.imageURL ? `${process.env.IMAGE_LOCATION}${category.imageURL}` : process.env.DEFAULT_IMAGE;
      let itemRes;

      if (!req.isAdmin) {
        itemRes = items;
      } else {
        itemRes = {
          items,
          totalPage,
          itemsCount,
          page: Number(page)
        }
      }
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Item Loaded Successfully',
        data: itemRes

      }
      this.send(resObj);
    } catch (e) {
      console.log('getItem', e);
      this.sendServerError(res, e.message);
    }
  }

  private getItem = async (req: express.Request, res: express.Response) => {
    try {
      let resData: IItemData;
      let queryParams: any = {};

      if (!req.isAdmin) {
        queryParams.status = true;
        queryParams._id = req.params.id;
      } else {
        queryParams._id = req.params.id
      }
      const item = await itemModel.findOne(queryParams);
      if (!item) {
        return this.sendBadRequest(res, 'Item Is Not Availabale.');
      }
      const subcategory = item ? await subcategoryModel.findOne({ _id: mongoose.Types.ObjectId(item.subcategoryId) }) : '';
      const category = subcategory ? await categoryModel.findOne({ _id: subcategory.categoryId }) : '';

      item.imageURL = item.imageURL ? `${process.env.IMAGE_LOCATION}${item.imageURL}` : process.env.DEFAULT_IMAGE;
      subcategory.imageURL = subcategory.imageURL ? `${process.env.IMAGE_LOCATION}${subcategory.imageURL}` : process.env.DEFAULT_IMAGE;
      category.imageURL = category.imageURL ? `${process.env.IMAGE_LOCATION}${category.imageURL}` : process.env.DEFAULT_IMAGE;

      resData = {
        ...item._doc,
        subcategory,
        category
      };

      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Item Loaded Successfully',
        data: resData
      }
      this.send(resObj);
    } catch (e) {
      console.log('getItem', e);
      this.sendServerError(res, e.message);
    }

  }

  private createItem = async (req: express.Request, res: express.Response) => {
    try {
      if (!req.body.name) {
        return this.sendBadRequest(res, 'Item Name Is Required.');
      }
      const itemData = await itemModel.findOne({ subcategoryId: req.body.subcategoryId, name: req.body.name });

      if (itemData) {
        return this.sendBadRequest(res, 'Item Name Is Already Available.');
      }
      const saveQueryParams = {
        name: req.body.name,
        description: req.body.description || '',
        imageURL: req.file && req.file.filename || '',
        subcategoryId: req.body.subcategoryId,
        quantity: req.body.quantity,
        price: req.body.price
      };
      const createdData = new itemModel(saveQueryParams);
      const result = await createdData.save();
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Item Added Successfully',
        data: result
      }
      this.send(resObj);
    } catch (e) {
      console.log('createItem', e);
      this.sendServerError(res, e.message);
    }
  }

  private updateItem = async (req: express.Request, res: express.Response) => {
    try {
      if (!req.body.name) {
        return this.sendBadRequest(res, 'Item Name Is Required.');
      }
      const itemData = await itemModel.findOne({ subcategoryId: req.body.subcategoryId, name: req.body.name });

      if (JSON.stringify(itemData._id) !== JSON.stringify(req.params.id)) {
        return this.sendBadRequest(res, 'Item Name Is Already Available.');
      }
      const saveQueryParams = {
        name: req.body.name,
        description: req.body.description,
        status: req.body.status,
        imageURL: req.file && req.file.filename || '',
        subcategoryId: req.body.subcategoryId,
        quantity: req.body.quantity,
        price: req.body.price
      };
      const result = await itemModel.findOneAndUpdate({ _id: req.params.id }, saveQueryParams);

      const resObj: IResponse = {
        res: res,
        status: 201,
        message: 'Item updated Successfully.',
        data: result
      }
      this.send(resObj);
    } catch (e) {
      console.log('updateItem', e);
      this.sendServerError(res, e.message);
    }
  }
}

export default ItemController;
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
    this.router.get(`${this.path}/:subcategoryId/items`, authMiddleware, this.getAllItemsBySubcategoryID);
    this.router.put(`${this.path}/items/:id`, authMiddleware, adminMiddleware, fileUploads.uploadFile().single('image'), this.updateItem);
    this.router.get(`${this.path}/items`, authMiddleware, adminMiddleware, fileUploads.uploadFile().single('image'), this.getItems);
    this.router.delete(`${this.path}/items/:id`, authMiddleware, adminMiddleware,this.deleteItem);
  }

  private getItems = async (req: express.Request, res: express.Response) => {
    try {
      let queryParams: any = {};
      let items: any = [];
      const page = req.query.page ? req.query.page : 0;
      const limit = page ? Number(req.query.limit) || Number(process.env.PAGE_LIMIT) : 1000;
      const skip = page ? Number((page - 1) * limit) : 0;

      if (req.query.keyword) {
        queryParams.name = new RegExp(`${req.query.keyword}`, 'i');
      }
      items = await itemModel.aggregate([
        { $match: queryParams },
        { $skip: skip },
        { $limit: limit },
        { $sort: { updatedAt: -1 } },
        {
          $lookup:
          {
            from: 'subcategories',
            localField: 'subcategoryId',
            foreignField: '_id',
            as: 'subcategory',
          }
        },
        {
          $lookup:
          {
            from: 'categories',
            localField: 'subcategory.categoryId',
            foreignField: '_id',
            as: 'category',
          }
        }
      ]);

      if (!items.length) {
        return this.sendBadRequest(res, 'Items Are Not Availabale.');
      }

      items.map((item) => {
        item.imageURL = item.imageURL ? `${process.env.IMAGE_LOCATION}${item.imageURL}` : process.env.DEFAULT_IMAGE;
        item.category.map((cat) => {
          cat.imageURL = cat.imageURL ? `${process.env.IMAGE_LOCATION}${cat.imageURL}` : process.env.DEFAULT_IMAGE;
        });
        return item.subcategory.map((subcat) => {
          subcat.imageURL = subcat.imageURL ? `${process.env.IMAGE_LOCATION}${subcat.imageURL}` : process.env.DEFAULT_IMAGE;
        });
      });

      const pageCount = page ? items.length / limit : 0;
      const totalPage = page ? (pageCount % 1 ? Math.floor(pageCount) + 1 : pageCount) : 0;

      let itemRes = {
        items,
        totalPage,
        itemsCount: items.length,
        page: Number(page)
      }
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Items Loaded Successfully',
        data: itemRes

      }
      this.send(resObj);
    } catch (e) {
      console.log('getItems', e);
      this.sendServerError(res, e.message);
    }
  }

  private getAllItemsBySubcategoryID = async (req: express.Request, res: express.Response) => {
    try {
      let queryParams: any = {};
      let items: any = [];
      queryParams.subcategoryId = mongoose.Types.ObjectId(req.params.subcategoryId);
      const page = req.query.page ? req.query.page : 0;
      const limit = page ? Number(req.query.limit) || Number(process.env.PAGE_LIMIT) : 1000;
      const skip = page ? Number((page - 1) * limit) : 0;
      
      if (!req.isAdmin) {
        queryParams.status = true;
        items = await itemModel.find(queryParams).skip(skip).limit(limit);
      } else {
        if (req.query.keyword) {
          items = await itemModel.aggregate([
            { $match: { name: new RegExp(`${req.query.keyword}`, 'i') } },
            { $skip: skip },
            { $limit: limit },
            { $sort: { updatedAt: -1 } },
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
      const pageCount = page ? items.length / limit : 0;
      const totalPage = page ? (pageCount % 1 ? Math.floor(pageCount) + 1 : pageCount) : 0;
      if (!req.isAdmin) {
        itemRes = items;
      } else {
        itemRes = {
          items,
          totalPage,
          itemsCount: items.length,
          page: Number(page)
        }
      }
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Items Loaded Successfully',
        data: itemRes

      }
      this.send(resObj);
    } catch (e) {
      console.log('getAllItemsBySubcategoryID', e);
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
     
      const itemData = await itemModel.findOne({ subcategoryId: req.body.subcategoryId, name: req.body.name });

      if (itemData && JSON.stringify(itemData._id) !== JSON.stringify(req.params.id)) {
        return this.sendBadRequest(res, 'Item Name Is Already Available.');
      }
      // const saveQueryParams = {
      //   name: req.body.name,
      //   description: req.body.description,
      //   status: req.body.status,
      //   imageURL: req.file && req.file.filename || '',
      //   subcategoryId: req.body.subcategoryId,
      //   quantity: req.body.quantity,
      //   price: req.body.price
      // };

      const saveQueryParams = {
        ...req.body,
      };

      if (req.file && req.file.filename) {
        saveQueryParams.imageURL = req.file.filename;
      }
      const result = await itemModel.findOneAndUpdate({ _id: req.params.id }, saveQueryParams);

      const resObj: IResponse = {
        res: res,
        status: 201,
        message: 'Item updated Successfully.',
        data: saveQueryParams
      }
      this.send(resObj);
    } catch (e) {
      console.log('updateItem', e);
      this.sendServerError(res, e.message);
    }
  }

  private deleteItem = async (req: express.Request, res: express.Response) => {
    try {

      await itemModel.remove({ _id: req.params.id });

      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Item deleted Successfully.',
        data: {}
      }
      this.send(resObj);
    } catch (e) {
      console.log('deleteItem', e);
      this.sendServerError(res, e.message);
    }
  }
}

export default ItemController;
import * as express from 'express';
import * as mongoose from 'mongoose';

import RequestBase from '../response/response.controller';
import itemModel from '../menu/item/item.model';
import orderModel from './order.model';
import authMiddleware from '../middleware/auth.middleware';
import { IResponse } from '../interfaces/response.interface';
import IOrder from './order.interface';

class OrderController extends RequestBase {
  public path = '/api/order';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, authMiddleware, this.createOrder);
    this.router.get(`${this.path}/:id`, authMiddleware, this.getOrder);
    this.router.get(`${this.path}`, authMiddleware, this.getAllOrders);
  }

  /** Caculates total quantity and sub total of all the items in cart */
  getOrderDetails = (res, items, totalQuantity = 0, subTotal = 0, index = 0) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (index < items.length) {
          const item = items[index];
          const itemData = await itemModel.findOne({ _id: item.itemId });
          if (!itemData.quantity) {
            return this.sendBadRequest(res, `${itemData.name} is sold out!`);
          }
          if (item.selectedQuantity > itemData.quantity) {
            return this.sendBadRequest(res, `Only few items are left!`);
          }
          totalQuantity = totalQuantity + item.selectedQuantity;
          subTotal = subTotal + (itemData.price * item.selectedQuantity);
          console.log('totalQuantity', totalQuantity);
          console.log('subTotal', subTotal);
          // items.splice(0, 1);
          index = index + 1;
          resolve(this.getOrderDetails(res, items, totalQuantity, subTotal, index));
        } else {
          resolve({ totalQuantity, subTotal });
        }
        resolve(true);
      } catch (e) {
        console.log('getOrderDetails', e);
        reject(e);
      }
    });
  }

  private createOrder = async (req: express.Request, res: express.Response) => {
    try {
      const orderData: IOrder = req.body;
      orderData.userId = req.user.id;

      /** @TODO Add setting colletion fetch tax data from collection */
      const tax = 15;

      let subTotal: any = 0;
      let totalQuantity: any = 0;

      const data: any = await this.getOrderDetails(res, req.body.items);

      totalQuantity = data.totalQuantity;
      subTotal = data.subTotal;
      const totalTaxAmount = (subTotal * tax) / 100;

      const saveQueryParams = {
        userId: req.user.id,
        totalQuantity,
        tax: tax.toFixed(2),
        items: req.body.items,
        subTotal: subTotal.toFixed(2),
        totalTaxAmount: totalTaxAmount.toFixed(2),
        total: (subTotal + totalTaxAmount).toFixed(2),
        status: true
      };
      if (saveQueryParams.total != Number(req.body.total)) {
        return this.sendBadRequest(res, 'Price of some item has changed.');
      };

      const createdData = new orderModel(saveQueryParams);
      const result = await createdData.save();

      req.body.items.map(async (item) => {
        await itemModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(item.itemId) }, { $inc: { quantity: -item.selectedQuantity } });
      });
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Order Placed Successfully',
        data: result
      }
      this.send(resObj);
    } catch (e) {
      console.log('createOrder', e);
      this.sendServerError(res, e.message);
    }

  }

  private getOrder = async (req: express.Request, res: express.Response) => {
    try {

      const order = await orderModel.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(req.params.id) } },
        {
          $lookup:
          {
            from: "items",
            localField: "items.itemId",
            foreignField: "_id",
            as: "itemList"
          }
        },
        {
          $lookup:
          {
            from: "categories",
            localField: "items.categoryId",
            foreignField: "_id",
            as: "categoryList"
          }
        }

      ]);
      if (!order.length) {
        return this.sendBadRequest(res, 'Incorrect Order ID');
      }
      order[0].categoryList.map((element) => {
        return element.imageURL = element.imageURL ? `${process.env.IMAGE_LOCATION}${element.imageURL}` : process.env.DEFAULT_IMAGE;
      });
      order[0].items.map(item => {
        order[0].itemList.map(element => {
          if (JSON.stringify(item.itemId) == JSON.stringify(element._id)) {
            item.itemDetails = element;
            item.itemDetails.imageURL = element.imageURL ? `${process.env.IMAGE_LOCATION}${element.imageURL}` : process.env.DEFAULT_IMAGE;
          }
        });
        order[0].categoryList.map(element => {
          if (JSON.stringify(item.categoryId) == JSON.stringify(element._id)) {
            item.category = element;
          }
        });
      });
      delete order[0].itemList;
      delete order[0].categoryList;

      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Order loaded Successfully',
        data: order[0]
      }
      this.send(resObj);
    } catch (e) {
      console.log('getOrder', e);
      this.sendServerError(res, e.message);
    }

  }

  private getAllOrders = async (req: express.Request, res: express.Response) => {
    try {
      const page = req.query.page ? req.query.page : 1;
      const ordersCount = await orderModel.count();
      const limit = Number(req.query.limit) || Number(process.env.PAGE_LIMIT);
      const skip = Number((page - 1) * limit);
      const orders = await orderModel.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(req.user.id) } },
        { $skip: skip },
        { $limit: limit },
        { $sort: { updatedAt: -1 } },
        {
          $lookup:
          {
            from: "items",
            localField: "items.itemId",
            foreignField: "_id",
            as: "itemList"
          }
        }, {
          $lookup:
          {
            from: "categories",
            localField: "items.categoryId",
            foreignField: "_id",
            as: "categoryList"
          }
        }
      ]);
      orders.map((order) => {
        order.categoryList.map((element) => {
          return element.imageURL = element.imageURL ? `${process.env.IMAGE_LOCATION}${element.imageURL}` : process.env.DEFAULT_IMAGE;
        });
        order.items.map(item => {
          order.itemList.map(element => {
            if (JSON.stringify(item.itemId) == JSON.stringify(element._id)) {
              item.itemDetails = element;
              item.itemDetails.imageURL = element.imageURL ? `${process.env.IMAGE_LOCATION}${element.imageURL}` : process.env.DEFAULT_IMAGE;
            }
          });
          order.categoryList.map(element => {
            if (JSON.stringify(item.categoryId) == JSON.stringify(element._id)) {
              item.category = element;
            }
          });
        });
        delete order.itemList;
        delete order.categoryList;
      });
      let pageCount = ordersCount / limit;
      const totalPage = pageCount % 1 ? Math.floor(pageCount) + 1 : pageCount
      const orderRes = {
        orders,
        ordersCount,
        page: Number(page),
        totalPage
      }
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Orders loaded Successfully',
        data: orderRes
      }
      this.send(resObj);
    } catch (e) {
      console.log('getAllOrders', e);
      this.sendServerError(res, e.message);
    }

  }

}

export default OrderController;
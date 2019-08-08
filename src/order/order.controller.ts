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

  private createOrder = async (req: express.Request, res: express.Response) => {
    try {
      const orderData: IOrder = req.body;
      const createdData = new orderModel(orderData);
      const result = await createdData.save();

      req.body.items.map(async (item) => {
        await itemModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(item.itemId) }, { $inc: { quantity: -item.quantity } });
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
        { "$match": { "_id": mongoose.Types.ObjectId(req.params.id) } },
        {
          $unwind: "$items"
        },
        // {
        //   "$lookup":
        //   {
        //     "from": 'items',
        //     "localField": 'items.itemId',
        //     "foreignField": '_id',
        //     "as": 'items'
        //   }
        // },
        {
          $group:
          {
            _id: "$_id",
            total: { $first: "$total" },
            subTotal: { $first: "$subTotal" },
            tax: { $first: "$tax" },
            orderId: { $first: "$orderId" },
            items: { $addToSet: "$items" },
          }
        },

      ]);
      if (!order.length) {
        return this.sendBadRequest(res, 'Incorrect Order ID');
      }
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Order loaded Successfully',
        data: order[0]
      }
      this.send(resObj);
    } catch (e) {
      console.log('createOrder', e);
      this.sendServerError(res, e.message);
    }

  }

  private getAllOrders = async (req: express.Request, res: express.Response) => {
    try {
      const order = await orderModel.aggregate([
        {
          $unwind: "$items"
        },
        {
          $group:
          {
            _id: "$_id",
            total: { $first: "$total" },
            subTotal: { $first: "$subTotal" },
            tax: { $first: "$tax" },
            orderId: { $first: "$orderId" },
            items: { $addToSet: "$items" },
          }
        },

      ])
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Order loaded Successfully',
        data: order
      }
      this.send(resObj);
    } catch (e) {
      console.log('createOrder', e);
      this.sendServerError(res, e.message);
    }

  }

}

export default OrderController;
import * as express from 'express';
import * as mongoose from 'mongoose';
import * as moment from 'moment';
import * as fs from 'fs';

import { CronJob } from 'cron';
import * as sftp_client from 'ssh2-sftp-client';

import RequestBase from '../response/response.controller';
import itemModel from '../menu/item/item.model';
import orderModel from './order.model';
import authMiddleware from '../middleware/auth.middleware';
import { IResponse } from '../interfaces/response.interface';
import IOrder from './order.interface';
import TaxController from '../settings/tax/tax.controller';

class OrderController extends RequestBase {
  public path = '/api/order';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/csv-upload/job`, this.uploadOrderCSV);
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
          if (item.selectedQuantity > 0) {
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
            item.price = itemData.price;
            items[index] = item;
            // items.splice(0, 1);
            index = index + 1;
            resolve(this.getOrderDetails(res, items, totalQuantity, subTotal, index));
          } else {
            items.splice(0, 1);
            resolve(this.getOrderDetails(res, items, totalQuantity, subTotal, index));
          }
        } else {
          resolve({ totalQuantity, subTotal, items });
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

      const taxController = new TaxController();
      const tax = await taxController.getTaxValue();

      let subTotal: any = 0;
      let totalQuantity: any = 0;

      const data: any = await this.getOrderDetails(res, req.body.items);
      if (!data.items.length) {
        return this.sendBadRequest(res, 'Please Select The Item Quantity.');
      }
      totalQuantity = data.totalQuantity;
      subTotal = data.subTotal;
      const totalTaxAmount = (subTotal * Number(tax)) / 100;

      const saveQueryParams = {
        userId: req.user.id,
        totalQuantity,
        tax: Number(tax).toFixed(2),
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
      // const ordersCount = await orderModel.count();
      const limit = Number(req.query.limit) || Number(process.env.PAGE_LIMIT);
      const skip = Number((page - 1) * limit);
      let queryParams = {};

      if (!req.isAdmin) {
        queryParams = { userId: mongoose.Types.ObjectId(req.user.id) }
      }
      const orders = await orderModel.aggregate([
        // { $match: { userId: mongoose.Types.ObjectId(req.user.id) } },
        { $match: queryParams },
        { $skip: skip },
        { $limit: limit },
        { $sort: { updatedAt: -1 } },
        {
          $lookup:
          {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
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
        order.user = order.user[0];
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
      let pageCount =  orders.length/ limit;
      const totalPage = pageCount % 1 ? Math.floor(pageCount) + 1 : pageCount
      const orderRes = {
        orders,
        ordersCount: orders.length,
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

  getAllOrdersToGenerateCSV = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const orders = await orderModel.aggregate([
          {
            /** Getting last 24 hours orders */
            $match: {
              "createdAt": {
                $lt: new Date(),
                $gte: new Date(new Date().setDate(new Date().getDate() - 1))
              }
            }
          },
          {
            $lookup:
            {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user"
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
        let orderFinalArray = [];
        orders.map((order) => {
          let orderObj: any = {};
          orderObj.companycode = order.user[0].companyCode2;
          orderObj.empNumber = order.user[0].empNumber;
          orderObj.foodtype = order.categoryList[0].name;
          orderObj.orderid = order.orderId;
          orderObj.amount = order.total;
          orderObj.currency = process.env.CURRENCY
          orderFinalArray.push(orderObj);
        });
        resolve(orderFinalArray);
      } catch (e) {
        console.log('getAllOrdersToGenerateCSV', e);
        reject(e);
      }
    });
  }

  genrateOrderCSV = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const orderData: any = await this.getAllOrdersToGenerateCSV();
        /** check if order file exist than rename the file */
        const filePath = process.env.ORDER_STORE_PATH + process.env.ORDER_FILE_NAME;
        const renameFilePath =
          process.env.ORDER_STORE_PATH +
          'order_' +
          moment()
            .subtract(1, 'day')
            .format('YYYY_MM_DD')
            .toString() +
          '.csv';
        fs.access(filePath, fs.constants.R_OK, err => {
          /** if error cancel operation and print the error log */
          if (err) {
            console.log('File Exist error :- ', err);
          }
          /** rename the file */
          fs.rename(filePath, renameFilePath, err => {
            /** if error  while renaming the file console error */
            if (err) {
              console.log('File rename error :- ', err);
            }
            /** if file rename create new file and begins write operation */
            let payload = '';
            orderData.map(order => {
              let orderArr = [
                order.companycode,
                order.empNumber,
                order.foodtype, // category name
                order.orderid,
                order.amount,
                order.currency, // $
              ];
              payload += orderArr.join(',') + '\n';
            });
            console.log('Order Payload :- ', payload);
            fs.writeFile(process.env.ORDER_STORE_PATH + process.env.ORDER_FILE_NAME, payload, err => {
              if (err) {
                console.log('Write File error :- ', err);
                reject(err);
              } else {
                console.log('File write success !');
                resolve(true);
              }
            });
          });
        });
      } catch (e) {
        console.log('uploadOrderFiletoFTPServer', e);
        reject(e);
      }
    });
  }

  uploadOrder = () => {
    try {
      const ftpClient = new sftp_client();
      ftpClient
        .connect({
          host: process.env.FTP_HOST,
          username: process.env.FTP_USERNAME,
          password: process.env.FTP_PASSWORD,
          protocol: process.env.FTP_PROTOCOL,
        })
        .then(conn => {
          console.log('FTP connection success =======> Uploading Order file started ....');
          ftpClient
            .fastPut(
              process.env.ORDER_STORE_PATH + process.env.ORDER_FILE_NAME,
              '/' + process.env.ORDER_FILE_NAME
            )
            .then(response => {
              console.log('File uploaded successfully ====> ', response);
              ftpClient.end();
            })
            .catch(err => {
              console.log('Uploading error ======> ', err);
              ftpClient.end();
            });
        });
      //call back on connection end
      ftpClient.on('end', () => {
        console.log('FTP connection closed !');
      });
    } catch (error) {
      console.log('FTP error ======> ', error);
    }
  };

  /**
   * Cron Job to generate and upload csv file of last 24 hours' orders
   */
  private uploadOrderCSV = async (req: express.Request, res: express.Response) => {
    try {
      new CronJob(process.env.AD_USER_UPDATE_JOB_TIME, async function () {
        console.log('You will see this message every second');
        await this.genrateOrderCSV();
        this.uploadOrder();
      }, null, true, 'America/Los_Angeles');
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Order CSV Upload Job Ran Job Successfully.',
        data: {}
      }
      this.send(resObj);
    } catch (e) {
      console.log('uploadOrderCSV', e);
      this.sendServerError(res, e.message);
    }
  }
}


export default OrderController;
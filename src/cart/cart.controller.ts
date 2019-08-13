import * as express from 'express';
import * as mongoose from 'mongoose';
import * as _ from 'lodash';

import RequestBase from '../response/response.controller';
import itemModel from '../menu/item/item.model';
import cartModel from './cart.model';
import authMiddleware from '../middleware/auth.middleware';
import { IResponse, ICartReturnData } from '../interfaces/response.interface';
import categoryModel from '../menu/category/category.model';

class CartController extends RequestBase {
  public path = '/api/cart';
  public router = express.Router();
  public returnData;
  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, authMiddleware, this.addToCart);
    this.router.put(`${this.path}`, authMiddleware, this.updateCart);
    this.router.get(`${this.path}`, authMiddleware, this.getCart);
  }

  /** Caculates total quantity and sub total of all the items in cart */
  getTotalDetails = (items, totalQuantity = 0, subTotal = 0, index = 0) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (index < items.length) {
          const item = items[index];
          const itemData = await itemModel.findOne({ _id: item.itemId });
          totalQuantity = totalQuantity + item.selectedQuantity;
          subTotal = subTotal + (itemData.price * item.selectedQuantity);
          // items.splice(0, 1);
          index = index + 1;
          resolve(this.getTotalDetails(items, totalQuantity, subTotal, index));
        } else {
          resolve({ totalQuantity, subTotal });
        }
        resolve(true);
      } catch (e) {
        console.log('getTotalDetails', e);
        reject(e);
      }
    });

  }

  /** Get details of user cart */
  getUserCart = (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const cartDetails = await cartModel.aggregate([
          { $match: { userId: mongoose.Types.ObjectId(userId) } },
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
        /** Appending full image URL */
        if (cartDetails.length) {
          cartDetails[0].categoryList.map((element) => {
            return element.imageURL = element.imageURL ? `${process.env.IMAGE_LOCATION}${element.imageURL}` : process.env.DEFAULT_IMAGE;
          });
          cartDetails[0].items.map(item => {
            cartDetails[0].itemList.map(element => {
              if (JSON.stringify(item.itemId) == JSON.stringify(element._id)) {
                item.itemDetails = element;
                item.itemDetails.imageURL = element.imageURL ? `${process.env.IMAGE_LOCATION}${element.imageURL}` : process.env.DEFAULT_IMAGE;
              }
            });
            cartDetails[0].categoryList.map(element => {
              if (JSON.stringify(item.categoryId) == JSON.stringify(element._id)) {
                item.category = element;
              }
            });
          });
          delete cartDetails[0].itemList;
          delete cartDetails[0].categoryList;
        }
        resolve(cartDetails[0]);
      } catch (e) {
        console.log('getUserCart', e);
        reject(e);
      }
    });

  }

  private getCart = async (req: express.Request, res: express.Response) => {
    try {
      const result = await this.getUserCart(req.user.id);
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Cart loaded Successfully.',
        data: result
      }
      this.send(resObj);
    } catch (e) {
      console.log('getCart', e);
      this.sendServerError(res, e.message);
    }

  }

  private addToCart = async (req: express.Request, res: express.Response) => {
    try {
      let itemList: any = [];
      const cart = await cartModel.findOne({ userId: req.body.userId });
      const item = await itemModel.findOne({ _id: req.body.itemId });

      /** @TODO Add setting colletion fetch tax data from collection */
      const tax = 15;

      if (req.body.selectedQuantity > item.quantity) {
        return this.sendBadRequest(res, 'Quantity Is Not Availaible For Selected Item');
      }
      let subTotal: any = 0;
      let totalQuantity: any = 0;

      /** If Items already available in cart */
      if (cart && cart.items.length) {
        itemList = cart.items;
        itemList.map((itemDetails, index) => {
          if (JSON.stringify(itemDetails.itemId) == JSON.stringify(req.body.itemId)) {
            itemList.splice(index, 1);
          }
        });
        itemList.push({
          itemId: req.body.itemId,
          selectedQuantity: req.body.selectedQuantity,
          categoryId: req.body.categoryId,
          subPrice: (req.body.selectedQuantity * item.price).toFixed(2),
        });
        const ItemListCopy = _.cloneDeep(itemList);
        const data: any = await this.getTotalDetails(ItemListCopy);
        totalQuantity = data.totalQuantity;
        subTotal = data.subTotal;
      } else {
        itemList.push({
          itemId: req.body.itemId,
          selectedQuantity: req.body.selectedQuantity,
          categoryId: req.body.categoryId,
          subPrice: (req.body.selectedQuantity * item.price).toFixed(2),
        });
        subTotal = (item.price * req.body.selectedQuantity);
        totalQuantity = req.body.selectedQuantity
      }
      const totalTaxAmount = (subTotal * tax) / 100;
      const updateQueryParams = {
        userId: req.body.userId,
        totalQuantity,
        tax: tax,
        items: itemList,
        subTotal: subTotal.toFixed(2),
        totalTaxAmount: totalTaxAmount.toFixed(2),
        total: (subTotal + totalTaxAmount).toFixed(2)
      };
      await cartModel.findOneAndUpdate({ userId: req.body.userId }, updateQueryParams, { upsert: true, new: true });

      const cartDetails = await this.getUserCart(req.body.userId);
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Item added in cart Successfully.',
        data: cartDetails
      }
      this.send(resObj);
    } catch (e) {
      console.log('addToCart', e);
      this.sendServerError(res, e.message);
    }

  }

  private updateCart = async (req: express.Request, res: express.Response) => {
    try {
      let itemList: any = [];
      const cart = await cartModel.findOne({ userId: req.body.userId });
      const item = await itemModel.findOne({ _id: req.body.itemId });

      /** @TODO Add setting colletion fetch tax data from collection */
      const tax = 15;

      if (req.body.selectedQuantity > item.quantity) {
        return this.sendBadRequest(res, 'Quantity Is Not Availaible For Selected Item');
      }
      let subTotal: any = 0;
      let totalQuantity: any = 0;

      /** If Items already available in cart */
      if (cart && cart.items.length) {
        itemList = cart.items;
        itemList.map((itemDetails, index) => {
          if (JSON.stringify(itemDetails.itemId) == JSON.stringify(req.body.itemId)) {
            itemList.splice(index, 1);
          }
        });
        if (req.body.selectedQuantity > 0) {
          itemList.push({
            itemId: req.body.itemId,
            selectedQuantity: req.body.selectedQuantity,
            categoryId: req.body.categoryId,
            subPrice: (req.body.selectedQuantity * item.price).toFixed(2),
          });
        }
        const ItemListCopy = _.cloneDeep(itemList);
        const data: any = await this.getTotalDetails(ItemListCopy);
        totalQuantity = data.totalQuantity;
        subTotal = data.subTotal;
      } else {
        return this.sendBadRequest(res, 'Selected Item is Not Available In Cart');
      }
      const totalTaxAmount = (subTotal * tax) / 100;
      const updateQueryParams = {
        userId: req.body.userId,
        totalQuantity,
        tax: tax,
        items: itemList,
        subTotal: subTotal.toFixed(2),
        totalTaxAmount: totalTaxAmount.toFixed(2),
        total: (subTotal + totalTaxAmount).toFixed(2)
      };
      await cartModel.findOneAndUpdate({ userId: req.body.userId }, updateQueryParams, { upsert: true, new: true });

      const cartDetails = await this.getUserCart(req.body.userId);
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Item updated in cart Successfully.',
        data: cartDetails
      }
      this.send(resObj);
    } catch (e) {
      console.log('updateCart', e);
      this.sendServerError(res, e.message);
    }

  }

}

export default CartController;
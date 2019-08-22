import * as express from 'express';
import * as mongoose from 'mongoose';
import * as _ from 'lodash';

import RequestBase from '../response/response.controller';
import itemModel from '../menu/item/item.model';
import cartModel from './cart.model';
import authMiddleware from '../middleware/auth.middleware';
import { IResponse } from '../interfaces/response.interface';
import TaxController from '../settings/tax/tax.controller';

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
    this.router.delete(`${this.path}`, authMiddleware, this.emptyCart);
  }

  /** Caculates total quantity and sub total of all the items in cart */
  getTotalDetails = (items, totalQuantity = 0, subTotal = 0, index = 0) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (index < items.length) {
          const item = items[index];
          const itemData = await itemModel.findOne({ _id: item.itemId });
          if (!itemData.quantity) {
            item.selectedQuantity = 0
          }
          if (item.selectedQuantity > itemData.quantity) {
            item.selectedQuantity = itemData.quantity
            // return this.sendBadRequest(res, `Only few items are left!`);
          }
          totalQuantity = totalQuantity + item.selectedQuantity;
          subTotal = subTotal + (itemData.price * item.selectedQuantity);
          item.price = itemData.price;
          items[index] = item;
          // items.splice(0, 1);
          index = index + 1;
          resolve(this.getTotalDetails(items, totalQuantity, subTotal, index));
        } else {
          resolve({ totalQuantity, subTotal, items });
        }
        resolve(true);
      } catch (e) {
        console.log('getTotalDetails', e);
        reject(e);
      }
    });

  }

  getCartData = (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const taxController = new TaxController();
        const tax = await taxController.getTaxValue();
        const cart = await cartModel.findOne({ userId });
        if (cart && cart.items) {
          const data: any = await this.getTotalDetails(cart.items);
          const totalQuantity = data.totalQuantity;
          const subTotal = data.subTotal;
          const tax = Number(process.env.TAX);
          const totalTaxAmount = (subTotal * tax) / 100;
          const updateQueryParams = {
            userId: userId,
            totalQuantity,
            tax: Number(tax).toFixed(2),
            items: data.items,
            subTotal: subTotal.toFixed(2),
            totalTaxAmount: totalTaxAmount.toFixed(2),
            total: (subTotal + totalTaxAmount).toFixed(2)
          };
          await cartModel.findOneAndUpdate({ userId }, updateQueryParams, { upsert: true, new: true });
          const result = await this.getUserCart(userId);
          resolve(result);
        } else {
          resolve({});
        }

      } catch (e) {
        reject(reject);
        console.log('getCartData', e);
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
        if (cartDetails[0].items.length) {
          resolve(cartDetails[0]);
        } else {
          resolve({});
        }
      } catch (e) {
        console.log('getUserCart', e);
        reject(e);
      }
    });

  }

  getCart = async (req: express.Request, res: express.Response) => {
    try {
      const result = await this.getCartData(req.user.id);
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
      const cart = await cartModel.findOne({ userId: req.user.id });
      const item = await itemModel.findOne({ _id: req.body.itemId });

      const taxController = new TaxController();
      const tax = await taxController.getTaxValue();

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
            price: Number(item.price).toFixed(2)
          });
        }
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
          price: Number(item.price).toFixed(2)
        });
        subTotal = (item.price * req.body.selectedQuantity);
        totalQuantity = req.body.selectedQuantity
      }
      const totalTaxAmount = (subTotal * Number(tax)) / 100;
      const updateQueryParams = {
        userId: req.user.id,
        totalQuantity,
        tax: Number(tax).toFixed(2),
        items: itemList,
        subTotal: subTotal.toFixed(2),
        totalTaxAmount: totalTaxAmount.toFixed(2),
        total: (subTotal + totalTaxAmount).toFixed(2)
      };
      await cartModel.findOneAndUpdate({ userId: req.user.id }, updateQueryParams, { upsert: true, new: true });

      const cartDetails = await this.getUserCart(req.user.id);
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
      const cart = await cartModel.findOne({ userId: req.user.id });
      const item = await itemModel.findOne({ _id: req.body.itemId });

      const taxController = new TaxController();
      const tax = await taxController.getTaxValue();

      if (req.body.selectedQuantity > item.quantity) {
        return this.sendBadRequest(res, 'Quantity Is Not Availaible For Selected Item');
      }
      let subTotal: any = 0;
      let totalQuantity: any = 0;

      /** If Items already available in cart */
      if (cart && cart.items.length) {
        itemList = cart.items;
        /** Removes items from array */
        itemList.map((itemDetails, index) => {
          if (JSON.stringify(itemDetails.itemId) == JSON.stringify(req.body.itemId)) {
            itemList.splice(index, 1);
          }
        });
        /** If quantity is > 0 againg adding item with updated quantity */
        if (req.body.selectedQuantity > 0) {
          itemList.push({
            itemId: req.body.itemId,
            selectedQuantity: req.body.selectedQuantity,
            categoryId: req.body.categoryId,
            subPrice: (req.body.selectedQuantity * item.price).toFixed(2),
            price: Number(item.price).toFixed(2)
          });
        }
        const ItemListCopy = _.cloneDeep(itemList);
        const data: any = await this.getTotalDetails(ItemListCopy);
        totalQuantity = data.totalQuantity;
        subTotal = data.subTotal;
      } else {
        return this.sendBadRequest(res, 'Selected Item is Not Available In Cart');
      }
      const totalTaxAmount = (subTotal * Number(tax)) / 100;
      const updateQueryParams = {
        userId: req.user.id,
        totalQuantity,
        tax: Number(tax).toFixed(2),
        items: itemList,
        subTotal: subTotal.toFixed(2),
        totalTaxAmount: totalTaxAmount.toFixed(2),
        total: (subTotal + totalTaxAmount).toFixed(2)
      };
      await cartModel.findOneAndUpdate({ userId: req.user.id }, updateQueryParams, { upsert: true, new: true });

      const cartDetails = await this.getUserCart(req.user.id);
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

  private emptyCart = async (req: express.Request, res: express.Response) => {
    try {
      await cartModel.findOneAndRemove({ userId: req.user.id });
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Cart Removed Successfully.',
        data: {}
      }
      this.send(resObj);
    } catch (e) {
      console.log('emptyCart', e);
      this.sendServerError(res, e.message);
    }

  }

}

export default CartController;
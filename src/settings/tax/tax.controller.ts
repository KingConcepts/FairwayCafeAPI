import * as express from 'express';

import RequestBase from '../../response/response.controller';
import taxModel from './tax.model';
import authMiddleware from '../../middleware/auth.middleware';
import { IResponse } from '../../interfaces/response.interface';
import adminMiddleware from '../../middleware/admin.middleware';

class TaxController extends RequestBase {

  public path = '/api/tax';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, authMiddleware, adminMiddleware, this.getAlltax);
    this.router.post(`${this.path}`, authMiddleware, adminMiddleware, this.createTax);
    this.router.get(`${this.path}/:id`, authMiddleware, adminMiddleware, this.getTax);
    this.router.put(`${this.path}/:id`, authMiddleware, adminMiddleware, this.updateTax);
  }

  getTaxValue = (isResId = false) => {
    return new Promise(async (resolve, reject) => {
      try {
        const tax = await taxModel.findOne({});
        isResId ? resolve(tax) : resolve(tax.value);
      } catch (e) {
        console.log('getTaxValue', e);
        reject(e);
      }
    });
  }

  private getAlltax = async (req: express.Request, res: express.Response) => {
    try {
      const taxs = await taxModel.find({});

      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Taxes Loaded Successfully',
        data: taxs
      }
      this.send(resObj);
    } catch (e) {
      console.log('getAlltax', e);
      this.sendServerError(res, e.message);
    }
  }

  private createTax = async (req: express.Request, res: express.Response) => {
    try {
      if (!req.body.name || !req.body.value) {
        return this.sendBadRequest(res, 'Tax Name and Label Is Required.');
      }
      const saveQueryParams = {
        name: req.body.name,
        description: req.body.description || '',
        value: Number(req.body.value).toFixed(2)
      };
      const createdData = new taxModel(saveQueryParams);
      const result = await createdData.save();
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Tax Added Successfully',
        data: result
      }
      this.send(resObj);
    } catch (e) {
      console.log('createTax', e);
      this.sendServerError(res, e.message);
    }
  }

  private getTax = async (req: express.Request, res: express.Response) => {
    try {

      const category = await taxModel.findOne({ _id: req.params.id });

      category.imageURL = category.imageURL ? `${process.env.IMAGE_LOCATION}${category.imageURL}` : process.env.DEFAULT_IMAGE;

      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Tax Loaded Successfully',
        data: category
      }
      this.send(resObj);
    } catch (e) {
      console.log('getTax', e);
      this.sendServerError(res, e.message);
    }
  }

  private updateTax = async (req: express.Request, res: express.Response) => {
    try {

      // const saveQueryParams = {
      //   name: req.body.name,
      //   description: req.body.description || '',
      //   status: req.body.status,
      //   value: Number(req.body.value).toFixed(2)
      // };

      const saveQueryParams = {
        ...req.body
      };

      const result = await taxModel.findOneAndUpdate({ _id: req.params.id }, saveQueryParams);

      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Tax updated Successfully',
        data: result
      }
      this.send(resObj);
    } catch (e) {
      console.log('updateTax', e);
      this.sendServerError(res, e.message);
    }
  }
}

export default TaxController;
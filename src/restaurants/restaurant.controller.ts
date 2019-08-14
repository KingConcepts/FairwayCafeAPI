import * as express from 'express';

import RequestBase from '../response/response.controller';
import restaurantModel from './restaurant.model';
import authMiddleware from '../middleware/auth.middleware';
import { IResponse } from '../interfaces/response.interface';
import adminMiddleware from '../middleware/admin.middleware';

class RestaurantController extends RequestBase {
  public path = '/api/restaurant';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, authMiddleware, adminMiddleware, this.addRestaurant);
    this.router.get(`${this.path}`, authMiddleware, adminMiddleware, this.getAllRestaurants);
    this.router.get(`${this.path}/:id`, authMiddleware, adminMiddleware, this.getRestaurant);
    this.router.put(`${this.path}/:id`, authMiddleware, adminMiddleware, this.updateRestaurant);
  }

  private addRestaurant = async (req: express.Request, res: express.Response) => {
    try {
      if (!req.body.name) {
        return this.sendBadRequest(res, 'Restaurant Name Is Required.');
      }
      const saveQueryParams = {
        name: req.body.name,
        description: req.body.description || '',
      };
      const createdData = new restaurantModel(saveQueryParams);
      const result = await createdData.save();

      const resObj: IResponse = {
        res: res,
        status: 201,
        message: 'Restaurant Added Successfully',
        data: result
      }
      this.send(resObj);
    } catch (e) {
      console.log('addRestaurant', e);
      // this.sendServerError(res, e.message);
    }
  }

  private getRestaurant = async (req: express.Request, res: express.Response) => {
    try {
      const restaurant = await restaurantModel.findOne({ _id: req.params.id });

      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Restaurant Loaded Successfully',
        data: restaurant
      }
      this.send(resObj);
    } catch (e) {
      console.log('getAllRestaurants', e);
      this.sendServerError(res, e.message);
    }
  }

  private getAllRestaurants = async (req: express.Request, res: express.Response) => {
    try {
      let restaurants: any;

      if (req.query.keyword) {
        restaurants = await restaurantModel.aggregate([
          { $match: { name: new RegExp(`${req.query.keyword}`, 'i') } }
        ]);
      } else {
        restaurants = await restaurantModel.find();
      }
      
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Restaurants Loaded Successfully',
        data: restaurants
      }
      this.send(resObj);
    } catch (e) {
      console.log('getAllRestaurants', e);
      this.sendServerError(res, e.message);
    }
  }

  private updateRestaurant = async (req: express.Request, res: express.Response) => {
    try {
      const saveQueryParams = {
        name: req.body.name,
        description: req.body.description,
        status: req.body.status
      };
      const result = await restaurantModel.findOneAndUpdate({ _id: req.params.id }, saveQueryParams);

      const resObj: IResponse = {
        res: res,
        status: 201,
        message: 'Restaurant Updated Successfully',
        data: result
      }
      this.send(resObj);
    } catch (e) {
      console.log('updateRestaurant', e);
      this.sendServerError(res, e.message);
    }
  }

}

export default RestaurantController;
import * as express from 'express';

export interface IUserData {
    _id: String;
    companyCode2: String;
    email: String;
    firstName: String;
    lastName: String;
    username: String;
    token: String;
    company: String;
};

export interface ISubcategoryData {
    _id: String;
    categoryId: String;
    name: String;
    description: String;
    imageURL: String;
    status: Boolean
}

export interface ICategoryData {
    _id: String;
    name: String;
    description: String;
    imageURL: String;
    status: Boolean
}

export interface IItemData {
    _id: String;
    name: String;
    description: String;
    imageURL: String;
    status: Boolean;
    price: Number;
    quantity: Number;
    subcategory: ISubcategoryData
    category: ICategoryData
}

export interface IResponse {
    res: express.Response;
    status: Number;
    message: String;
    data: any;
};

export interface ICartDetails {
    totalQuantity: Number;
    subTotal: Number;
}
export interface ICartReturnData {
	returnData: ICartDetails;
}

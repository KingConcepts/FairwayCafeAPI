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

export interface IResponse {
    res: express.Response
    status: Number;
    message: String;
    data: IUserData
};
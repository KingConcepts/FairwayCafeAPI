import IResponseBase from './response.interface'
import constants from '../constants/constants'

class ResponseBase {

    response: IResponseBase = {
        status: 200,
        message: '',
        payload: {}
    }

    constructor() {

    }

    /**
     * Sends Express response with provided status, message and data
     */
    public send = (resObj) => {
        this.response.status = resObj.status;
        this.response.message = resObj.message;
        this.response.payload = resObj.data;
        // res.set({
        //     'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        //     'Expires': '-1',
        //     'Pragma': 'no-cache'
        // });
        // resObj.res.status(resObj.status).json(this.response);
        resObj.res.json(this.response);
    }
    /**
     * Sends Express Response with 500 Server error and err detail as data.
     */
    public sendServerError = (res, err) => {
        const resObj = {
            res,
            status: constants.error.ServerError.status,
            message: constants.error.ServerError.message,
            data: err
        }
        this.send(resObj);
    }
    /**
     * Sends exress response with 404(status) not found(msg).
     */
    public sendNotFound = (res) => {
        const resObj = {
            res,
            status: constants.error.ResourceNotFound.status,
            message: constants.error.ResourceNotFound.message,
            data: {}
        }
        this.send(resObj);
    }
    /**
     * Sends exress response with 401(status) not authorized(msg).
     */
    public sendNotAuthorized = (res) => {
        const resObj = {
            res,
            status: constants.error.NotAuthorized.status,
            message: constants.error.NotAuthorized.message,
            data: {}
        }
        this.send(resObj);
    }
    /**
     * Sends exress response with 400(status) Bad Request(msg).
     */
    public sendBadRequest = (res, err) => {
        const resObj = {
            res,
            status: constants.error.BadRequest.status,
            message: err,
            data: {}
        }
        this.send(resObj);
    }
    /**
     * Sends express response with 401(status) Invalid Token
     */
    public invalidToken = (res) => {
        const resObj = {
            res,
            status: constants.error.InvalidToken.status,
            message: constants.error.InvalidToken.message,
            data: {}
        }
        this.send(resObj);
    }
    /**
     * Sends express response with 403(status) Access Denied
     */
    public accessDenied = (res) => {
        const resObj = {
            res,
            status: constants.error.AccessDenied.status,
            message: constants.error.AccessDenied.message,
            data: {}
        }
        this.send(resObj);
    }
}

export default ResponseBase;
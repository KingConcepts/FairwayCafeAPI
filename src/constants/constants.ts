import {
    IError,
    ICommonError
} from "./constants.interface";

class Contants {
    public error: IError = {
        ServerError: <ICommonError>{
            message: 'Inetarnal Server Error',
            status: 500
        },
        ResourceNotFound: <ICommonError>{
            message: 'Resource Not Found',
            status: 404
        },
        NotAuthorized: <ICommonError>{
            message: 'Not Authorized',
            status: 401
        },
        InvalidToken: <ICommonError>{
            message: 'Invalid Token',
            status: 401
        },
        BadRequest: <ICommonError>{
            message: '',
            status: 400
        },
        AccessDenied: <ICommonError>{
            message: 'Access Denied',
            status: 403
        },
    }

}

export default new Contants
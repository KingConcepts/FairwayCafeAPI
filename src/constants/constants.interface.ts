export interface ICommonError {
    message: string;
    status: number;
}

export interface IError {
    ServerError : ICommonError;
    ResourceNotFound : ICommonError;
    NotAuthorized : ICommonError;
    InvalidToken : ICommonError;
    BadRequest: ICommonError;
    AccessDenied: ICommonError;
}

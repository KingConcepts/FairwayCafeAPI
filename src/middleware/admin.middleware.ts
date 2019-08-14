import { NextFunction, Response } from 'express';

import RequestWithUser from '../interfaces/requestWithUser.interface';
import ResponseBase from '../response/response.controller';

async function adminMiddleware(req: RequestWithUser, res: Response, next: NextFunction) {
    const responseBase = new ResponseBase();
    try {
        if (req.isAdmin) {
            next();
        } else {
            responseBase.accessDenied(res);
        }
    } catch (e) {
        console.log(e);
        responseBase.sendServerError(res, e.message);
    }
}

export default adminMiddleware;
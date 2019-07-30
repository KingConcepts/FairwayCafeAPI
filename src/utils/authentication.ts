import * as jwt from 'jsonwebtoken';

export class Authentication {

  public genratetoken(userId) {
    return new Promise((resolve, reject) => {
      try {
        const token = jwt.sign({
          data: {
            id: userId,
          }
        }, process.env.JWT_SECRET);
        resolve(token);
      } catch (e) {
        console.log('genratetoken', e);
        reject(e);
      }
    });
  };

  public verifyToken(token) {
    return new Promise((resolve, reject) => {
      try {
        const userData = jwt.verify(token, process.env.JWT_SECRET);
        resolve(userData);
      } catch (e) {
        console.log('verifyToken', e);
        reject(e);
      }
    });
  }
}

export default new Authentication;



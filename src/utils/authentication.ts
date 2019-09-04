import * as jwt from 'jsonwebtoken';

export class Authentication {

  public genratetoken(userId, isForgotPass = false) {
    return new Promise((resolve, reject) => {
      try {
        let token;
        if (isForgotPass) {
          token = jwt.sign({
            data: {
              id: userId,
            }
          }, process.env.JWT_SECRET, { expiresIn: '1h' });
        } else {
          token = jwt.sign({
            data: {
              id: userId,
            }
          }, process.env.JWT_SECRET);
        }

        resolve(token);
      } catch (e) {
        console.log('genratetoken', e);
        reject(e);
      }
    });
  };

  public genrateAdminToken(userId, isForgotPass = false) {
    return new Promise((resolve, reject) => {
      try {
        let token;
        if (isForgotPass) {
          token = jwt.sign({
            data: {
              id: userId,
              isAdmin: true
            }
          }, process.env.JWT_SECRET, { expiresIn: '1h' });
        } else {
          token = jwt.sign({
            data: {
              id: userId,
              isAdmin: true
            }
          }, process.env.JWT_SECRET);
        }

        resolve(token);
      } catch (e) {
        console.log('genrateAdminToken', e);
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

  public validatePassword(password) {
    // const re = /^(?=.*[A-Za-z_@.\/#&+-])(?=.*\d)[A-Za-z_@.\/#&+\-\d]{8,}$/;
    // return re.test(password);
    const length = password.length;
   if(length >= 6) {
     return true;
   }
   return false;
  };

  /** Used to generate random password */
  public generateRandomString(length = 7) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    result += '$';
    return result;
  }
}

export default new Authentication;



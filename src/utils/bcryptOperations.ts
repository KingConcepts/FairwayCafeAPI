import * as bcrypt from 'bcrypt';

export class BycryptOprations {
  public genratePasswordHash(password) {
    return new Promise((resolve, reject) => {
      try {
        bcrypt.hash(password, 10, function (err, hash) {
          if (hash) {
            console.log(hash);
            resolve(hash);
          }
          console.log('genratePasswordHash', err);
          reject(err);
        });
      } catch (e) {
        console.log('genratePasswordHash', e);
        reject(e);
      }
    });
  };
  
  public comparePassword(userPassword, DBpassword) {
    return new Promise((resolve, reject) => {
      try{
        bcrypt.compare(userPassword, DBpassword, function (err, isMatch) {
          if (err) {
              reject(err);
          } else {
              resolve(isMatch);
          }
      });
      } catch (e) {
        console.log('comparePassword', e);
        reject(e);
      }
    })
  }
}

export default new BycryptOprations;



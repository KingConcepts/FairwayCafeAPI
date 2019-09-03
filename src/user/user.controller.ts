import * as express from 'express';
import * as fs from 'fs';
import { CronJob } from 'cron';
import * as sftp_client from 'ssh2-sftp-client';

import userModel from './user.model';
import userTokenModel from '../authentication/userToken.model';
import bycryptOprations from '../utils/bcryptOperations';
import { IResponse } from 'interfaces/response.interface';
import RequestBase from '../response/response.controller';
import authentication from '../utils/authentication';
// import notification from '../utils/notification';
// import cron from '../utils/cronJob';

const activeDirectoryFile = 'AD/AD.txt';

class UserController extends RequestBase {
  public path = '/api/user';
  public router = express.Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/change_password`, this.changePassword);
    this.router.put(`${this.path}/AD`, this.updateUsers);
    this.router.get(`${this.path}/AD/job`, this.updateUserFromADJob);
    this.router.get(`${this.path}`, this.getAllUsers);

  }

  private changePassword = async (req: express.Request, res: express.Response) => {
    try {
      const user = await userModel.findOne({ _id: req.body.id }, { 'password': 1 });
      const isPasswordMatched = await bycryptOprations.comparePassword(req.body.oldPassword, user.password);
      if (isPasswordMatched) {
        const isPasswordValidate = authentication.validatePassword(req.body.password);

        if (!isPasswordValidate) {
          return this.sendBadRequest(res, 'Password should a 8-character length with at least 1 alphabet and 1 number');
        }
        const updateParams = {
          password: await bycryptOprations.genratePasswordHash(req.body.password)
        }
        await userModel.updateOne({ _id: user._id }, updateParams);
        await userTokenModel.findOneAndUpdate({ _id: req.body.id }, { status: 'Inactive' });
        const resObj: IResponse = {
          res: res,
          status: 201,
          message: 'Password Changed Successfully',
          data: {}
        }
        this.send(resObj);
      } else {
        this.sendBadRequest(res, 'Old Password Is Incorrect');
      }
    } catch (e) {
      console.log('changePassword', e);
      this.sendServerError(res, e.message);
    }
  }

  saveUsers = (payload: any = {}) => {
    return new Promise((resolve, reject) => {
      try {
        let result: number = 0;
        let failed = [];
        const empCode = ['CGI', 'CGS', 'CGC'];

        payload.map((item = {}) => {
          if (item.empNumber !== '' && item.email !== '' && empCode.includes(item.companyCode2.trim())) {
            userModel.updateOne({ empNumber: item.empNumber }, item, { upsert: true }, (err, data) => {
              if (err) {
                failed.push(item.empNumber);
                console.log('DB ERROR', err);
              } else {
                result++;
              }
            });
          }
        });
        if (failed.length > 0) {
          resolve(false);
        } else {
          console.log('==saveUsers==')
          resolve(true);
        }
      } catch (e) {
        console.log('saveUsers', e);
        reject(e);
      }
    })

  };

  updateUserFromAD = () => {
    return new Promise((resolve, reject) => {
      try {
        fs.readFile(activeDirectoryFile, 'utf8', (error, contents) => {
          let dataArr = contents.split('\n');
          let subArr = [];
          dataArr.map(data => {
            let elementArr = {
              filler: data.substring(0, 2).trim(), //hard coded -> 00
              empNumber: data.substring(2, 8).trim(),
              firstName: data.substring(8, 33).trim(),
              lastName: data.substring(33, 58).trim(),
              middleName: data.substring(58, 68).trim(),
              preferredName: data.substring(68, 93).trim(),
              busPhone: data.substring(93, 103).trim(),
              companyCode: data.substring(103, 107).trim(),
              costCtr: data.substring(107, 147).trim(),
              costCtrDesc: data.substring(147, 187).trim(),
              filler2: data.substring(187, 189).trim(), //hard coded -> B1
              status: data.substring(189, 191).trim(), //Active = 3, Terminated = 0, LOA = 1
              empType: data.substring(191, 193).trim(),
              filler3: data.substring(193, 198).trim(),
              shift: data.substring(197, 199).trim(),
              email: data.substring(199, 239).trim(),
              email2: data.substring(239, 279).trim(),
              supervisorFirstName: data.substring(279, 304).trim(),
              supervisorLastName: data.substring(304, 329).trim(),
              supervisorEmail: data.substring(329, 359).trim(),
              supervisorPhone: data.substring(359, 389).trim(),
              employeeMailStop: data.substring(389, 439).trim(),
              dateOfOriginalHire: data.substring(439, 447).trim(),
              dateOfLastHire: data.substring(447, 455).trim(),
              filler4: data.substring(455, 463).trim(),
              dateOfLastPrefRev: data.substring(463, 471).trim(),
              dateOfNextPrefRev: data.substring(471, 479).trim(),
              jobCode: data.substring(479, 487).trim(),
              jobDescription: data.substring(487, 577).trim(),
              filler5: data.substring(577, 585).trim(),
              busPartnerName: data.substring(585, 615).trim(),
              filler6: data.substring(615, 619).trim(), //Hard coded -> XXXX
              busPartnerEmail: data.substring(619, 649).trim(),
              supervisorEmpNumber: data.substring(649, 655).trim(),
              companyCode2: data.substring(655, 660).trim(), // CGS, CGC, CGS, etc
              functionDescription: data.substring(660, 685).trim(),
              location: data.substring(685, 705).trim(),
              orgChartElig: data.substring(705, 706).trim(),
            };
            subArr.push(elementArr);
          });
          this.saveUsers(subArr);
          resolve(true);
        });
      } catch (e) {
        console.log('updateUserFromAD', e);
        reject(e);
      }
    });
  }

  getUserFromAD = () => {
    return new Promise((resolve, reject) => {
      try {
        const ftpClient = new sftp_client();
        /** connect to the FTP server */
        ftpClient
          .connect({
            host: process.env.FTP_HOST,
            username: process.env.FTP_USERNAME,
            password: process.env.FTP_PASSWORD,
            protocol: process.env.FTP_PROTOCOL,
          })
          .then(res => {
            /** on successfully connection check if the AD file exist or not */
            ftpClient
              .list('/')
              .then(resData => {
                if (resData && resData[0]) {
                  let list = resData[0];
                  if (list.name && list.name === process.env.AD_FILE_NAME) {
                    /** if file found then fetch the new file */
                    ftpClient
                      .fastGet(list.name, process.env.AD_STORE_PATH + list.name, {}, err => {
                        console.log('File Download Error ------------------ ', err);
                        ftpClient.end();
                      })
                      .then(fRes => {
                        /** on successfully file download close the connection. */
                        console.log(fRes);
                        ftpClient.end();
                      })
                      .catch(err => {
                        console.log('File Download Error ---- ', err);
                      });
                  }
                }
              })
              .catch(err => {
                console.log('File List Error ---- ', err);
              });
          });
        /** call back on connection end. */
        ftpClient.on('end', () => {
          console.log('FTP CONNECTION CLOSED .......');
        });

      } catch (e) {
        console.log('getUserFromAD', e);
        reject(e);
      }
    });
  };

  /** Get Users from AD and updates its to DB  */
  private updateUsers = async (req: express.Request, res: express.Response) => {
    try {
      // await this.getUserFromAD();
      this.updateUserFromAD();
      const resObj: IResponse = {
        res: res,
        status: 201,
        message: 'User Updated Successfully',
        data: {}
      }
      this.send(resObj);
    } catch (e) {
      console.log('updateusers', e);
      this.sendServerError(res, e.message);
    }
  }

  private updateUserFromADJob = async (req: express.Request, res: express.Response) => {
    try {
      new CronJob(process.env.AD_USER_UPDATE_JOB_TIME, async function () {
        console.log('You will see this message every second');
        await this.getUserFromAD();
        this.updateUserFromAD();
      }, null, true, 'America/Los_Angeles');
      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'User Update Job Ran Successfully.',
        data: {}
      }
      this.send(resObj);
    } catch (e) {
      console.log('updateUserFromADJob', e);
      this.sendServerError(res, e.message);
    }
  }

  private getAllUsers = async (req: express.Request, res: express.Response) => {
    try {

      const requireFields = {
        'empNumber': 1,
        'email': 1,
        'companyCode2': 1,
        'lastName': 1,
        'firstName': 1,
        'username': 1,
        'isRegistered': 1
      }

      let queryParams: any = {};
      const page = req.query.page ? req.query.page : 1;
      const limit = Number(req.query.limit) || Number(process.env.PAGE_LIMIT);
      const skip = page ? Number((page - 1) * limit) : 0;
      const usersCount = await userModel.count();

      if (req.query.keyword) {
        queryParams.name = new RegExp(`${req.query.keyword}`, 'i');
      }
      const users = await userModel.aggregate([
        { $match: queryParams },
        { $skip: skip },
        { $limit: limit },
        { $sort: { updatedAt: -1 } },
        { $project: requireFields}
      ]);

      const pageCount =  usersCount / limit;
      const totalPage = page ? (pageCount % 1 ? Math.floor(pageCount) + 1 : pageCount) : 0;

      const userRes = {
        users,
        totalPage,
        usersCount,
        page: Number(page)
      }

      const resObj: IResponse = {
        res: res,
        status: 200,
        message: 'Users loaded Successfully',
        data: userRes
      }
      this.send(resObj);
    } catch (e) {
      console.log('getAllUsers', e);
      this.sendServerError(res, e.message);
    }
  }

}

export default UserController;

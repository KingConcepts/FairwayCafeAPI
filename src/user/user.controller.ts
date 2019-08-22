import * as express from 'express';
import * as fs from 'fs';

import userModel from './user.model';
import userTokenModel from '../authentication/userToken.model';
import bycryptOprations from '../utils/bcryptOperations';
import { IResponse } from 'interfaces/response.interface';
import RequestBase from '../response/response.controller';
import authentication from '../utils/authentication';
import notification from '../utils/notification';

import cron from '../utils/cronJob';

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
    this.router.get(`${this.path}/AD/update`, this.updateADusers);
    this.router.get(`${this.path}/test`, this.test)
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
      res.json({
        status: 500,
        message: 'Some error occured',
        data: e.message
      });
    }
  }

  saveData = (payload: any = {}) => {
    let result: any = 0;
    let failed: any = [];
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
      return false;
    } else {
      return true;
    }
  };

  private updateADusers = async (req: express.Request, res: express.Response) => {
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
      this.saveData(subArr);
      res.send(JSON.stringify(subArr));
    });
  }

  private test = async (req: express.Request, res: express.Response) => {
    // cron.cron();
    notification.sendEmail();
    res.send(true);
  }
}

export default UserController;

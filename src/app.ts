import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as cors from 'cors';
// import * as swaggerUi from 'swagger-ui-express';

// import swaggerDocument from './swagger.json';
// const swaggerDocument = require('./swagger.json');
// import errorMiddleware from './middleware/error.middleware';

class App {
  public app: express.Application;
  public port: number;
  // public router = express.Router();


  constructor(controllers, port) {
    this.app = express();
    this.port = port;

    this.connectToTheDatabase();
    this.initializeMiddlewares();
    // this.initializeErrorHandling();
    this.initializeControllers(controllers);
  }

  private initializeMiddlewares() {
    this.app.use(cors('*'));
    this.app.use(bodyParser.json());
    // this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    this.app.use('/', express.static('public'));
  }

  private initializeControllers(controllers) {
    controllers.forEach((controller) => {
      this.app.use('/', controller.router);
    });
  }

  // private initializeErrorHandling() {
  //   this.app.use(errorMiddleware);
  // }

  private connectToTheDatabase() {
    mongoose.connect(process.env.DB_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });
  }
  public listen() {
    this.app.listen(this.port, () => {
      console.log(`App listening on the port ${this.port}`);
    });
  }
}

export default App;
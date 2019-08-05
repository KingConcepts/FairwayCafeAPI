import 'dotenv/config';
import App from './app';
import PostsController from './posts/posts.controller';
import UserController from './user/user.controller';
import Authentication from './authentication/authentication.controller';
 
const app = new App(
  [
    new PostsController(),
    new UserController(),
    new Authentication(),
  ],
  process.env.PORT,
);
 
app.listen();
import 'dotenv/config';
import App from './app';
import PostsController from './posts/posts.controller';
import UserController from './user/user.controller';
import UserTokenController from './userToken/userToken.controller';
 
const app = new App(
  [
    new PostsController(),
    new UserController(),
    new UserTokenController(),
  ],
  process.env.PORT,
);
 
app.listen();
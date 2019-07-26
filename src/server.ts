import 'dotenv/config';
import App from './app';
import PostsController from './posts/posts.controller';
import UserController from './user/user.controller';
 
const app = new App(
  [
    new PostsController(),
    new UserController(),
  ],
  process.env.PORT,
);
 
app.listen();
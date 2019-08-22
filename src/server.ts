import 'dotenv/config';
import App from './app';
import PostsController from './posts/posts.controller';
import UserController from './user/user.controller';
import Authentication from './authentication/authentication.controller';
import CategoryController from './menu/category/category.controller';
import SubCategoryController from './menu/subcategory/subcategory.controller';
import ItemController from './menu/item/item.controller';
import OrderController from './order/order.controller';
import CartController from './cart/cart.controller';
import AdminController from './admin/admin.controller';
import RestaurantController from './restaurants/restaurant.controller';
import TaxController from './settings/tax/tax.controller';

const app = new App(
  [
    new PostsController(),
    new UserController(),
    new Authentication(),
    new CategoryController(),
    new SubCategoryController(),
    new ItemController(),
    new OrderController(),
    new CartController(),
    new AdminController(),
    new RestaurantController(),
    new TaxController(),
  ],
  process.env.PORT,
);
 
app.listen();
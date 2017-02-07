/**
 * Created by Andreas on 05.02.2017.
 */

import * as user from '../controllers/user.controller';
import multipart from 'connect-multiparty';
const multipartMiddleware = multipart();

export default (app, router, auth, admin) => {

  router.param('userId',user.load);
  router.patch('/user/:userId',auth, user.update,user.show);
  router.get('/user/notifications/:userId/', auth, user.notifications)

}

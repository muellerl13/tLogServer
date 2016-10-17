/**
 * Created by salho on 13.10.16.
 */
import * as poi from '../controllers/poi.controller';

export default (app, router, auth, admin) => {
  router.post('/poi',auth,poi.create);
  router.get('/poi',auth,poi.all);
}

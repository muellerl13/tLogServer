/**
 * Created by salho on 17.10.16.
 */
import * as trip from '../controllers/trip.controller';
import * as poi from '../controllers/poi.controller';

const checkPermission = condition => (req,res,next) =>
  condition(req) ? next() :
    res.status(403).json({message: "You are not allowed to change somebody else's trip"});

const tripOwnerCondition = req => req.user.username === req.trip.creator.local.username;
const tripOwnerOrAdminCondition = req => tripOwnerCondition(req) || req.user.roles.includes('admin');


export default (app, router, auth, admin) => {
  router.post('/trip/addpoi/:tripId',auth,checkPermission(tripOwnerCondition),poi.create,trip.addPOI,trip.show);
  router.patch('/trip/:tripId',auth,checkPermission(tripOwnerCondition),trip.update,trip.show);
  router.post('/trip',auth,trip.create,trip.show);
  router.get('/trip',auth,trip.list);
  router.param('tripId',trip.load);
  router.get('/trip/mine',auth,trip.mine);
  router.get('/trip/count',auth,trip.count);
  router.get('/trip/all', auth, trip.all);
  router.patch('/trip/:tripId/like',auth,trip.likeOrDislike,trip.show);
  router.post('/trip/:tripId/comment',auth,trip.comment,trip.show);
  router.delete('/trip/:tripId',auth,checkPermission(tripOwnerOrAdminCondition),trip.remove);
  router.get('/trip/:tripId',trip.show);
}

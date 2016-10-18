/**
 * Created by salho on 17.10.16.
 */
import * as trip from '../controllers/trip.controller';
import * as poi from '../controllers/poi.controller';


const isTripOwner = (req,res,next) =>
  req.user.username === req.trip.creator.local.username ? next() :
    res.status(401).json({message: "You are not allowed to change somebody else's trip"});

export default (app, router, auth, admin) => {
  router.post('/trip/addpoi/:tripId',auth,isTripOwner,poi.create,trip.addPOI,trip.show);
  router.post('/trip',auth,trip.create,trip.show);
  router.get('/trip',auth,trip.list);
  router.param('tripId',trip.load);
  router.get('/trip/mine',auth,trip.mine);
  router.get('/trip/:tripId',trip.show);

}

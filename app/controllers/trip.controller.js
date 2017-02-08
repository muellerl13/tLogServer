/**
 * Created by salho on 17.10.16.
 */

import Trip from '../models/trip.model';
import User from '../models/user.model';
import Comment from '../models/comment.model'

export const show = (req,res) => {
  try {
    res.json(req.trip);
  } catch(err) {res.status(500).json({message: `Could not send this Trip: ${err.message}`})}
};

export const create = (req,res,next) => {
  try {
    let trip = new Trip(req.body);
    trip.creator = req.user.id;
    trip.save()
      .then(trip => Trip.load(trip._id))
      .then((trip)=>{req.trip = trip; next()})
      .catch(err => res.status(400).json({message: `Could not create this Trip: ${err.message}`}))
  } catch(err) {res.status(500).json({message: `Could not create this Trip: ${err.message}`})}
};

export const list = (req,res,next) => {
  try {
    let page = parseInt(req.query.page || '0');
    let size = parseInt(req.query.size || '100');
    Trip.find()
      .sort('-createdAt')
      .skip(page * size)
      .limit(size)
      .populate('creator', 'local.username')
      .then(data => res.json(liked(data,req)))
      .catch(err => res.json(500,{message:err.message}))
  } catch(err) {res.status(500).json({message: `Could not list Trips: ${err.message}`})}
};

export const load = (req,res,next,id) =>{
  try {
    console.log(id);
     Trip.load(id)
      .then((trip)=>{req.trip = trip; next()})
      .catch(err => res.status(400).json({message: `Could not load this Trip: ${err.message}`}))
  } catch(err) {res.status(500).json({message: err.message})}
};

export const mine = (req,res,next) =>{
  try {
    Trip.find({creator: req.user.id}).sort("-createdAt").populate('creator', 'local.username')
      .then(trips => res.json(liked(trips,req)))
      .catch(err => res.status(400).json({message: err.message}))
  } catch(err) {res.status(500).json({message: err.message})}
};

export const addPOI = (req,res,next) =>{
  try {
    req.trip.pois.push(req.poi);
    req.trip.save()
      .then(trip => Trip.load(trip._id))
      .then(trip => {req.trip=trip; next()})
      .catch(err => res.status(400).json({message: err.message}))
  } catch(err) {res.status(500).json({message: err.message})}
};

export const liked = (trips,req) =>{
  let newTrips = [];
  trips.forEach(trip => {
    trip.liked = false;
    for(let i = 0; i < trip.likes.length; i++){
      if(String(trip.likes[i].userId) == String(req.user.id)){
        trip.liked = true;
      }
    }
    newTrips.push(trip);
  });
  return newTrips;
};

export const likeOrDislike = (req, res, next) => {
  try {
    const trip = req.trip;
    let index = -1;

    //const index = trip.likes.map(e => {
    //  String(e.userId)
    //}).indexOf(String(req.user.id));

    for (let i = 0, len = trip.likes.length; i < len; i++) {

      if(String(trip.likes[i].userId)==String(req.user.id)){
        index = i;
      }
    }
    if (index != -1) {
      trip.likes.splice(index, 1);
      User.findOne({
        _id: trip.creator._id
      })
        .then(user => {
          console.log("In load function then");
          //if (user.newLike == undefined) {
          //  user.newLike = [];
          //}
          //console.log(user.newLike);
          console.log(trip._id);
          user.newLike = user.newLike.filter((item)=>String(item.tripId)!=String(trip._id));
          //let newnewLike =
            //user.newLike = newnewLike;
          user.save()
            .then((user3) => {
              //console.log(user3.newLike);
              trip.save()
              .then(trip => Trip.load(trip._id))
              .then(trip => {
                req.trip = trip;
                next();
              })
              .catch(err => res.status(400).json({message: "The Trip could not be liked/unliked: "+ err.message}));
            })
            .catch(err => res.status(400).json({message: "The user like could not be saved: "+ err.message}));

        })
        .catch(err => {
          console.log("In load function catch");
          res.status(400).json({message: "catch 1"})
        });
    } else {
      trip.likes.push({
        userId: req.user.id,
        username: req.user.username
      });

      User.findOne({
        _id: trip.creator._id
      })
        .then(user => {
          console.log(user.newLike);
          console.log("In load function then");
          //if (user.newLike == undefined) {
          //  user.newLike = [];
          //}
          user.newLike.push({
            tripId: req.trip._id,
            tripname: req.trip.name
          });
          user.save()
            .then((user2) => {
              //console.log(user2.newLike);
              trip.save()
              .then(trip => Trip.load(trip._id))
              .then(trip => {
                req.trip = trip;
                next();
              })
              .catch(err => res.status(400).json({message: "The Trip could not be liked/unliked: "+ err.message}))
            })
            .catch(err => res.status(400).json({message: "The user like could not be saved: "+ err.message}));

        })
        .catch(err => {
          console.log("In load function catch");
          res.status(400).json({message: "catch 2"})
        });
    }


  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

export const all = (req,res,next) =>{
  try {
    Trip.find({}).sort("-createdAt")
      .then(trips => res.json(liked(trips,req)))
      .catch(err => res.status(400).json({message: err.message}))
  } catch(err) {res.status(500).json({message: err.message})}
};

export const comment = (req,res,next) =>{
  try{
    let trip = req.trip;
    let comment = new Comment();
    comment.content = req.body.content;
    comment.creator = req.body.user;
    comment.save().then(comment => {trip.comments.push(comment);
      trip.save()
        .then(updatedTrip => Trip.load(updatedTrip._id))
        .then(updatedTrip => {req.trip = updatedTrip; next()})})
      .catch(err => res.status(400).json({message: "The Trip could not be commented on: "+ err.message}));
  }catch(err){
    res.status(500).json({message: err.message})
  }
}

export const remove = (req,res,next) =>{
  try {
    Promise.all(req.trip.pois.map(poi=>poi.remove()))
      .then(req.trip.remove())
      .then(trip => res.status(200).json({message: `Trip was successfully deleted!`}))
      .catch(err => res.status(400).json({message: err.message}))
  } catch(err) {res.status(500).json({message: err.message})}
};

export const count = (req,res,next) =>{
  try {
    Trip.count({})
      .then(count => res.json(count))
      .catch(err => res.status(400).json({message: err.message}))
  } catch(err) {res.status(500).json({message: err.message})}
};

export const update = (req,res,next) => {
  try {
  if (req.body._id && req.trip._id.toString() !== req.body._id) {
    res.status(400).json({message: 'Wrong trip id'});
  } else {
    const trip = Object.assign(req.trip,req.body);
    trip.save()
      .then(trip => Trip.load(trip._id))
      .then(trip => {req.trip = trip;next();})
      .catch(err => res.status(400).json({message: err.message}))
  }
  } catch(err) {res.status(500).json({message: err.message})}
};

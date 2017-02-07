/**
 * Created by salho on 17.10.16.
 */

import Trip from '../models/trip.model';

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
    let size = parseInt(req.query.size || '10');
    Trip.find()
      .sort('-createdAt')
      .skip(page * size)
      .limit(size)
      .populate('creator', 'local.username')
      .then((data) => res.json(data))
      .catch(err => res.json(500,{message:err.message}))
  } catch(err) {res.status(500).json({message: `Could not list Trips: ${err.message}`})}
};

export const load = (req,res,next,id) =>{
  try {
     Trip.load(id)
      .then((trip)=>{req.trip = trip; next()})
      .catch(err => res.status(400).json({message: `Could not load this Trip: ${err.message}`}))
  } catch(err) {res.status(500).json({message: err.message})}
};

export const mine = (req,res,next) =>{
  try {
    Trip.find({creator: req.user.id}).sort("-createdAt").populate('creator', 'local.username')
      .then(trips => res.json(trips))
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

export const likeOrDislike = (req, res, next) => {
  try {
    console.log("!!!!!! " + req.params.userId);
    const trip = req.trip;
    const index = trip.likes.map(e => String(e.userId)).indexOf(req.user.id);
    if (index != -1) {
      trip.likes.splice(index, 1);
    } else {
      trip.likes.push({
        userid: req.user.id,
        username: req.user.username
      });
    }
    trip.save()
      .then(trip => Trip.load(trip._id))
      .then(trip => {
        req.trip = trip;
        next();
      })
      .catch(err => res.status(400).json({message: "The Trip could not be liked/unliked: "+ err.message}));
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

export const comment = (req,res,next) =>{
  try{
    let trip = req.trip;
    let comment = new Comment(req.body)
    trip.comments.push(comment)
    //trip.
    trip.save()
      .then(updatedTrip => Trip.load(updatedTrip._id))
      .then(updatedTrip => {req.trip = updatedTrip; next()})
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

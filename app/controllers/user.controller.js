/**
 * Created by Andreas on 05.02.2017.
 */

import User from '../models/user.model';

export const update = (req,res,next) => {
  try {

      const user = Object.assign(req.user,req.body);
      user.save()
        .then(user => User.load(user._id))
        .then(user => {req.user = user;next();})
        .catch(err => res.status(400).json({message: err.message}))

  } catch(err) {res.status(500).json({message: err.message})}
};

export const show = (req, res) => res.json(req.user);

export const load = (req, res, next, id) => {
  try {
    User.load(id)
      .then(poi => {
        req.poi = poi;
        next()
      })
      .catch(err => res.status(400).json({message: "This POI could not be found"}));
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

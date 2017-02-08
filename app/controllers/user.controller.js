/**
 * Created by Andreas on 05.02.2017.
 */

import User from '../models/user.model';

export const update = (req,res,next) => {
  console.log("In update function");
  try {

      let user = req.userN;
      user.local.username = req.body.username;
      user.local.email = req.body.email;
      if(req.body.password != undefined){
        user.local.password = user.generateHash(req.body.password);
      }
      console.log(user);
      user.save()
        .then(user => User.findOne({
          _id: req.userN.id
        }))
        .then(user => {req.user = user;next();})
        .catch(err => res.status(400).json({message: err.message}))

  } catch(err) {res.status(500).json({message: err.message})}
};

export const show = (req, res) => res.json(req.user);

export const load = (req, res, next, id) => {
  console.log("In load function");
  try {
    console.log("In TRY");
    User.findOne({
      _id: id
    })
      .then(user => {
        console.log("In load function then");
        req.userN = user;
        next()
      })
      .catch(err => {
        console.log("In load function catch");
        res.status(400).json({message: "This POI could not be found"})
      });
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

export const notifications = (req, res) => {

  console.log("In notification function")
  try {
    let output = req.userN.newLike;

    req.userN.newLike=[];
    req.userN.save().then(() => res.json(output))
      .catch((err) => {res.status(500).json({message: err.message})})


  } catch(err) {res.status(500).json({message: err.message})}

};

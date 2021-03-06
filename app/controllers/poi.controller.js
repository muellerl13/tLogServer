/**
 * Created by salho on 13.10.16.
 */
import POI from '../models/poi.model';
import mongoose from "mongoose";
import grid from "gridfs-stream";
import gm from "gm";
import fs from "fs";
grid.mongo = mongoose.mongo;


export const create = (req, res, next) => {
  const poi = new POI(req.body);
  poi.creator = req.user.id;
  poi.save()
    .then(poi => POI.load(poi._id))
    .then(poi => {
      req.poi = poi;
      next()
    })
    .catch(err => res.status(400).json({message: err.message}));
};

export const all = (req, res, next) => {
  try {
    let page = parseInt(req.query.page || '0');
    let size = parseInt(req.query.size || '100');
    POI.find()
      .sort('-createdAt')
      .skip(page * size)
      .limit(size)
      .populate('creator', 'local.username')
      .then((data) => res.json(data))
      .catch(err => res.status(500).json({message: err.message}))
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

export const mine = (req,res,next) =>{
  try {
    POI.find({creator: req.user.id}).sort("-createdAt").populate('creator', 'local.username')
      .then(pois => res.json(pois))
  .catch(err => res.status(400).json({message: err.message}))
  } catch(err) {res.status(500).json({message: err.message})}
};

export const load = (req, res, next, id) => {
  try {
    POI.load(id)
      .then(poi => {
        req.poi = poi;
        next()
      })
      .catch(err => res.status(400).json({message: "This POI could not be found"}));
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

export const show = (req, res) => res.json(req.poi);

export const update = (req, res, next) => {
  try {
    const poi = Object.assign(req.poi, req.body);
    poi.save()
      .then(poi => POI.load(poi._id))
      .then(poi => {
        req.poi = poi;
        next()
      })
      .catch(err => res.status(400).json({message: "This POI could not be updated: "+ err.message}));
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

export const destroy = (req, res, next) => {
  try {
    req.poi.remove()
      .then(()=>next())
      .catch(err => res.status(500).json({message: "Could not delete this POI"}))
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

export const image = (req, res) => {
  try {
    const gfs = grid(mongoose.connection.db);
    console.log("id=" + req.params.imageId);
    let ObjectID = mongoose.mongo.ObjectID;
    gfs.createReadStream({_id: new ObjectID(req.params.imageId)}).pipe(res);
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

export const deleteImage = (req,res,next) =>{
  const gfs = grid(mongoose.connection.db);
  const id = req.params.imageId;
  let ObjectID = mongoose.mongo.ObjectID;
  gfs.remove({_id: new ObjectID(id)}, function (err) {
    if (err){
      console.log('error deleting');
     return handleError(err);}
    console.log('delete successful');
  });
  const poi = req.poi;
  let newImageArray = [];
  for(let i = 0; i < poi.images.length; i++){
    if(poi.images[i].id != id){
      newImageArray.push(poi.images[i])
    }
  }
  poi.images = newImageArray;
  poi.save()
    .then(poi => POI.load(poi._id))
    .then(poi => res.json(poi))
    .catch(err => res.status(500).send({
      message: "Could not delete image" + err.message
    }));

};

export const filterImage = (req,res, next) => {
  try{
    const gfs = grid(mongoose.connection.db);
    let poi = req.poi;
    const id = req.body.imageId;
    let ObjectID = mongoose.mongo.ObjectID;
    const wStream = gfs.createWriteStream({
      filename:'filteredImage',
    });

    if(req.body.filterType == "gray"){
     const stream = gm(gfs.createReadStream({_id: new ObjectID(id)})).channel("gray").stream().pipe(wStream);
      stream.on('close', file => {
        let poi = req.poi;
        poi.images.push({
          description: req.body.description,
          id: file._id,
          uploaded: Date.now(),
          user: req.user.username
        });
        stream.on('error',  error => {
          res.status(500).send({
            message: "Could not save filtered image"
          });
        });
        poi.save()
          .then(poi => POI.load(poi._id))
          .then(poi => res.json(poi))
          .catch(err => res.status(500).send({
            message: "Could not filter image to and save it " + err.message
          }));
      });
    }else if(req.body.filterType == "sepia"){
      const stream = gm(gfs.createReadStream({_id: new ObjectID(id)})).modulate(115,0,100).colorize(7,21,50).stream().pipe(wStream);
      stream.on('close', file => {
        let poi = req.poi;
        poi.images.push({
          description: req.body.description,
          id: file._id,
          uploaded: Date.now(),
          user: req.user.username
        });
        stream.on('error',  error => {
          res.status(500).send({
            message: "Could not save filtered image"
          });
        });
        poi.save()
          .then(poi => POI.load(poi._id))
          .then(poi => res.json(poi))
          .catch(err => res.status(500).send({
            message: "Could not filter image to and save it " + err.message
          }));
      });
    }else if(req.body.filterType == "warm"){
      const stream = gm(gfs.createReadStream({_id: new ObjectID(id)})).colorize(0,50,50).stream().pipe(wStream);
      stream.on('close', file => {
        let poi = req.poi;
        poi.images.push({
          description: req.body.description,
          id: file._id,
          uploaded: Date.now(),
          user: req.user.username
        });
        stream.on('error',  error => {
          res.status(500).send({
            message: "Could not save filtered image"
          });
        });
        poi.save()
          .then(poi => POI.load(poi._id))
          .then(poi => res.json(poi))
          .catch(err => res.status(500).send({
            message: "Could not filter image to and save it " + err.message
          }));
      });
    }else if(req.body.filterType == "cold"){
      const stream = gm(gfs.createReadStream({_id: new ObjectID(id)})).colorize(50,0,0).stream().pipe(wStream);
      stream.on('close', file => {
        let poi = req.poi;
        poi.images.push({
          description: req.body.description,
          id: file._id,
          uploaded: Date.now(),
          user: req.user.username
        });
        stream.on('error',  error => {
          res.status(500).send({
            message: "Could not save filtered image"
          });
        });
        poi.save()
          .then(poi => POI.load(poi._id))
          .then(poi => res.json(poi))
          .catch(err => res.status(500).send({
            message: "Could not filter image to and save it " + err.message
          }));
      });
    }


    next()

  } catch (err){
    res.status(500).json({message: "Could not filter image: "+ err.message})
  }


};

export const addImage = function (req, res) {
  try {
    const gfs = grid(mongoose.connection.db);
    const maxDimension = process.env.MAX_IMAGE_DIMENSION || 500;
    if (req.files.file == null) {
      res.status(400).json({
        message: "There needs to be an element called 'file' that contains the image"
      });
      return;
    }
    const file = req.files.file;
    const wStream = gfs.createWriteStream({
      mode: 'w',
      filename: file.name,
      content_type: file.type,
      metadata: {
        poi: req.poi._id,
        creator: req.user.id
      }
    });
    const s = gm(file.path).resize(maxDimension).stream().pipe(wStream);
    s.on('close', file => {
      const poi = req.poi;
      poi.images.push({
        description: req.body.description,
        id: file._id,
        uploaded: Date.now(),
        user: req.user.username
      });
      poi.save()
        .then(poi => res.json(file))
        .catch(err => res.status(500).send({
          message: "Could not add image to POI " + err.message
        }));
    });
    s.on('error',  error => {
      res.status(500).send({
        message: "Could not save image"
      });
    });
  } catch (error) {
    console.log(error.stack);
    res.status(500).send({
      message: "Could not save image " + error.message
    });
  }
};




/**
 * Created by salho on 13.10.16.
 */
import POI from '../models/poi.model';

export const create = (req,res,next) => {
  const poi = new POI(req.body);
  poi.creator = req.user.id;
  poi.save()
    .then(poi => POI.load(poi._id))
    .then( poi => {req.poi = poi; next()})
    .catch(err => res.json(400,{message:err.message}));
};

export const all = (req, res, next) => {
  try {
    let page = parseInt(req.query.page || '0');
    let size = parseInt(req.query.size || '10');
    POI.find()
      .sort('-createdAt')
      .skip(page * size)
      .limit(size)
      .populate('creator', 'local.username')
      .then((data) => res.json(data))
      .catch(err => res.json(500,{message:err.message}))
  } catch(err) {
    res.json(500,{message:err.message})
  }
};

export const load = (req, res, next, id) => {
  try {
    POI.load(id)
      .then(poi => {req.poi = poi; next()})
      .catch(err => res.status(400).json({message: "This POI could not be found"}));
  } catch(err) {
    res.status(500).json({message:err.message})
  }
};

export const show = (req,res) => res.json(req.poi);

export const update = (req, res, next) => {
  try {
    const poi = Object.assign(req.poi,req.body);
    poi.save()
      .then(poi => POI.load(poi._id))
      .then(poi => {req.poi = poi;next()})
  } catch(err) {
    res.status(500).json({message:err.message})
  }
};

export const destroy = (req,res,next) => {
  try {
    req.poi.remove()
      .then(()=>next())
      .catch(err => res.status(500).json({message:"Could not delete this POI"}))
  } catch(err) {
    res.status(500).json({message:err.message})
  }
}

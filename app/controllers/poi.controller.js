/**
 * Created by salho on 13.10.16.
 */
import POI from '../models/poi.model';

export const create = (req,res) => {
  const poi = new POI(req.body);
  poi.creator = req.user.id;
  poi.save()
    .then(poi => POI.load(poi._id))
    .then( poi => res.json(poi))
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
}

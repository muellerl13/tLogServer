/**
 * Created by salho on 13.10.16.
 */
import mongoose from 'mongoose';
mongoose.Promise = global.Promise;
let Schema = mongoose.Schema;

const commentSchema = Schema({
  creator: {
    type: Schema.ObjectId,
    required: true,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    "default": Date.now
  },
  content: String
});

commentSchema.path('creator').validate(function(creator) {
  return creator != null;
}, 'Creator must be specified');

commentSchema.statics.load = function(id) {
  return this.findOne({
    _id: id
  }).populate('creator','local.username');
};

export default mongoose.model('Comment',commentSchema);

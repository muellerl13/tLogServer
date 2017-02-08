/**
 * Created by salho on 13.10.16.
 */
import mongoose from 'mongoose';
mongoose.Promise = global.Promise;
let Schema = mongoose.Schema;

const commentSchema = Schema({
  creator: String,
  createdAt: {
    type: Date,
    "default": Date.now
  },
  content: String
});



commentSchema.statics.load = function(id) {
  return this.findOne({
    _id: id
  });
};

export default mongoose.model('Comment',commentSchema);

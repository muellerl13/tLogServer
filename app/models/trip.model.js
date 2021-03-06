/**
 * Created by salho on 17.10.16.
 */
import mongoose from 'mongoose';
mongoose.Promise = global.Promise;
let Schema = mongoose.Schema;

const TripSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  begin: Date,
  end: Date,
  createdAt: {
    type: Date,
    "default": Date.now
  },
  creator: {
    type: Schema.ObjectId,
    required: true,
    ref: 'User'
  },
  pois: [
    {
      type: Schema.Types.ObjectId,
      ref: 'POI'
    }
  ],
  likes: [
    {
      userId: Schema.Types.ObjectId,
      username: String
    }
  ],
  liked: Boolean,
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ]
});


/**
 * Validations
 */

TripSchema.path('name').validate(function(name) {
  return name != null;
}, 'Name cannot be blank');

TripSchema.path('creator').validate(function(creator) {
  return creator != null;
}, 'Creator must be specified');

TripSchema.statics.load = function(id) {
  return this.findById(id).populate('creator', 'local.username _id').populate('pois').populate('comments');
};

export default mongoose.model('Trip',TripSchema);

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['study_room', 'lab', 'hall', 'sports', 'other'],
  },
  capacity: {
    type: Number,
    required: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
  bookings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    startTime: Date,
    endTime: Date,
    bookedAt: {
      type: Date,
      default: Date.now,
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
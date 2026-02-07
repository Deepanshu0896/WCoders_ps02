const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true,
  },
  startTime: {
    type: String,
    required: true, // Format: "09:00"
  },
  endTime: {
    type: String,
    required: true, // Format: "10:00"
  },
  subject: {
    type: String,
    required: true,
  },
  room: String,
});

const timetableSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  slots: [timeSlotSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Timetable', timetableSchema);
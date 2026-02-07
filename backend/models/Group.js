const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  activityType: {
    type: String,
    enum: ['study_group', 'project_work', 'assignment_help', 'exam_prep', 'skill_workshop'],
    required: true,
  },
  subject: String,
  location: String,
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  maxMembers: {
    type: Number,
    default: 5,
    min: 2,
    max: 20,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isPrivate: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Group', groupSchema);
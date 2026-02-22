import mongoose from 'mongoose';

const commandStatsSchema = new mongoose.Schema({
  commandName: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  count: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  users: [{
    userId: Number,
    count: Number,
    lastUsed: Date
  }],
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Method to increment command usage
commandStatsSchema.methods.incrementUsage = async function(userId) {
  this.count += 1;
  this.lastUsed = Date.now();
  
  const userStat = this.users.find(u => u.userId === userId);
  if (userStat) {
    userStat.count += 1;
    userStat.lastUsed = Date.now();
  } else {
    this.users.push({
      userId,
      count: 1,
      lastUsed: Date.now()
    });
  }
  
  return this.save();
};

// Static method to get or create command stat
commandStatsSchema.statics.trackCommand = async function(commandName, userId, description = '') {
  let stat = await this.findOne({ commandName });
  
  if (!stat) {
    stat = await this.create({
      commandName,
      description,
      count: 1,
      users: [{ userId, count: 1, lastUsed: Date.now() }]
    });
  } else {
    await stat.incrementUsage(userId);
  }
  
  return stat;
};

// Static method to get top commands
commandStatsSchema.statics.getTopCommands = async function(limit = 10) {
  return this.find()
    .sort({ count: -1 })
    .limit(limit)
    .exec();
};

export const CommandStats = mongoose.model('CommandStats', commandStatsSchema);

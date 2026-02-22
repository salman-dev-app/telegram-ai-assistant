import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    index: true,
    enum: ['web', 'mobile', 'bot', 'api', 'design', 'other']
  },
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  shortName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  demoUrl: {
    type: String,
    default: null
  },
  files: [{
    fileName: String,
    fileDescription: String,
    fileUrl: String
  }],
  price: {
    type: String,
    default: 'Free'
  },
  features: [String],
  viewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Get templates by category
templateSchema.statics.getByCategory = async function(category) {
  return this.find({ category, isActive: true }).sort({ createdAt: -1 });
};

// Get all categories
templateSchema.statics.getAllCategories = async function() {
  const templates = await this.find({ isActive: true });
  const categories = [...new Set(templates.map(t => t.category))];
  return categories;
};

// Get template by name
templateSchema.statics.getByName = async function(name) {
  return this.findOne({ name, isActive: true });
};

export const Template = mongoose.model('Template', templateSchema);

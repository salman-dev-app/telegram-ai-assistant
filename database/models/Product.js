import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  features: {
    type: [String],
    default: []
  },
  demoUrl: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    default: 'General'
  },
  thumbnail: { // FIXED: was thumbnailUrl in model, thumbnail in some utils
    type: String,
    default: null
  },
  contactUrl: {
    type: String,
    default: 'https://t.me/Otakuosenpai'
  },
  files: [{
    fileName: String,
    fileDescription: String,
    fileUrl: String
  }]
}, {
  timestamps: true
});

// Method to format product info for AI
productSchema.methods.getFormattedInfo = function() {
  const featuresText = this.features.length > 0
    ? `\nFeatures: ${this.features.join(', ')}`
    : '';
  
  const demoText = this.demoUrl
    ? `\nDemo: ${this.demoUrl}`
    : '';
  
  return `${this.name} - ${this.price}\n${this.description}${featuresText}${demoText}`;
};

// Static method to get all active products formatted
productSchema.statics.getAllFormatted = async function() {
  const products = await this.find({ isActive: true });
  if (products.length === 0) {
    return 'No products available at the moment.';
  }
  return products.map(p => p.getFormattedInfo()).join('\n\n');
};

export const Product = mongoose.model('Product', productSchema);

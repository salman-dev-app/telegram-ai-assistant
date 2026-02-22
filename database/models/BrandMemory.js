import mongoose from 'mongoose';

const brandMemorySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'salman_dev_memory'
  },
  about: {
    type: String,
    default: 'Salman Dev is a professional developer and tech entrepreneur.'
  },
  services: {
    type: [String],
    default: []
  },
  offers: {
    type: String,
    default: ''
  },
  availability: {
    type: String,
    default: 'Available for projects and consultations.'
  },
  customNotes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['online', 'busy', 'away'],
    default: 'online'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Social links
  socialLinks: {
    telegram: { type: String, default: 'https://t.me/Otakuosenpai' },
    github: { type: String, default: 'https://github.com/salman-dev-app' },
    whatsapp: { type: String, default: null },
    email: { type: String, default: 'mdsalmanhelp0@gmail.com' },
    portfolio: { type: String, default: null },
    youtube: { type: String, default: null },
  },
  // FAQ entries
  faqs: [{
    question: String,
    answer: String
  }],
  // Daily greeting toggle
  dailyGreetingEnabled: {
    type: Boolean,
    default: false
  },
  greetingGroupId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Method to get formatted memory for AI prompt
brandMemorySchema.methods.getFormattedMemory = function() {
  const servicesText = this.services.length > 0 
    ? `Services: ${this.services.join(', ')}`
    : '';
  
  return `
About Salman Dev: ${this.about}
${servicesText}
${this.offers ? `Current Offers: ${this.offers}` : ''}
Availability: ${this.availability}
Status: ${this.status}
${this.customNotes ? `Additional Notes: ${this.customNotes}` : ''}
`.trim();
};

// Static method to get or create memory
brandMemorySchema.statics.getMemory = async function() {
  let memory = await this.findOne({ key: 'salman_dev_memory' });
  if (!memory) {
    memory = await this.create({ key: 'salman_dev_memory' });
  }
  return memory;
};

export const BrandMemory = mongoose.model('BrandMemory', brandMemorySchema);

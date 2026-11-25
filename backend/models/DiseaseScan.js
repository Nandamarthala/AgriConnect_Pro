const mongoose = require('mongoose');

const diseaseResultSchema = new mongoose.Schema({
  id: { type: String, default: '' },
  name: { type: String, default: '' },
  confidence: { type: Number, min: 0, max: 100, default: 0 },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  crop: { type: String, default: '' },
  cause: { type: String, default: '' },
  symptoms: { type: [String], default: [] },
  prevention: { type: [String], default: [] },
  medicine: { type: [String], default: [] },
  icon: { type: String, default: '' },
}, { _id: false });

const diseaseScanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, default: '' },
  isHealthy: { type: Boolean, required: true },
  disease: { type: diseaseResultSchema, default: null },
  source: { type: String, enum: ['plant.id'], required: true },
}, { timestamps: true });

diseaseScanSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('DiseaseScan', diseaseScanSchema);

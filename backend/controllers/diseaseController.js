/* ============================================================
   Disease Detection Controller — Plant.id analysis and account history
   ============================================================ */
const axios = require('axios');
const DiseaseScan = require('../models/DiseaseScan');
const { uploadToCloudinary } = require('../middleware/upload');

const toTextList = (value) => {
  if (!Array.isArray(value)) return typeof value === 'string' && value ? [value] : [];
  return value
    .map((item) => (typeof item === 'string' ? item : item?.name || item?.description || ''))
    .filter(Boolean);
};

const getDiseaseHistory = async (req, res, next) => {
  try {
    const scans = await DiseaseScan.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, scans });
  } catch (error) {
    next(error);
  }
};

const detectDisease = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a plant image.' });
    }

    const plantIdKey = process.env.PLANTID_API_KEY;
    if (!plantIdKey || plantIdKey === 'your_plant_id_api_key') {
      return res.status(503).json({
        success: false,
        message: 'Live disease analysis is not configured yet. Add the plant analysis API credentials to the backend environment.',
      });
    }

    let response;
    try {
      response = await axios.post(
        'https://api.plant.id/v2/health_assessment',
        {
          images: [`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`],
          modifiers: ['crops_fast', 'similar_images'],
          disease_details: ['cause', 'description', 'treatment', 'classification'],
        },
        {
          headers: { 'Api-Key': plantIdKey, 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );
    } catch (providerError) {
      console.error('Plant analysis provider request failed:', providerError.message);
      const error = new Error('The live disease analysis provider is unavailable. Please try again later.');
      error.statusCode = 502;
      throw error;
    }

    const health = response.data?.health_assessment;
    if (!health) {
      const error = new Error('The live disease analysis provider returned an invalid response.');
      error.statusCode = 502;
      throw error;
    }

    const topDisease = health.diseases?.[0];
    if (!topDisease && health.is_healthy !== true) {
      const error = new Error('The provider could not identify this plant condition. Try a clearer photo.');
      error.statusCode = 422;
      throw error;
    }

    const disease = topDisease ? {
      name: topDisease.name || 'Unclassified condition',
      confidence: Math.round((topDisease.probability || 0) * 100),
      severity: topDisease.probability > 0.7 ? 'high' : topDisease.probability > 0.4 ? 'medium' : 'low',
      cause: topDisease.disease_details?.cause || '',
      symptoms: toTextList(topDisease.disease_details?.description),
      prevention: toTextList(topDisease.disease_details?.treatment?.biological),
      medicine: toTextList(topDisease.disease_details?.treatment?.chemical),
    } : null;

    let imageUrl = '';
    try {
      const uploaded = await uploadToCloudinary(req.file.buffer, 'connect-pro/disease');
      imageUrl = uploaded.secure_url || '';
    } catch (uploadError) {
      console.warn('Disease scan image was not archived:', uploadError.message);
    }

    const scan = await DiseaseScan.create({
      user: req.user._id,
      imageUrl,
      isHealthy: health.is_healthy === true,
      disease,
      source: 'plant.id',
    });

    res.json({
      success: true,
      isHealthy: scan.isHealthy,
      imageUrl: scan.imageUrl,
      disease: scan.disease,
      source: scan.source,
      scanId: scan._id,
      createdAt: scan.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { detectDisease, getDiseaseHistory };

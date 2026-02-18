'use strict';

const multer = require('multer');
const path = require('path');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

const createS3Storage = (prefix = 'users/') =>
  multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, prefix + uniqueSuffix + ext);
    },
    contentType: function (req, file, cb) {
      cb(null, file.mimetype);
    },
    cacheControl: 'max-age=31536000',
  });

const s3Storage = createS3Storage('users/');

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'), false);
  }
};

const upload = multer({
  storage: s3Storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single('image');

const uploadImage = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed.',
      });
    }
    next();
  });
};

const uploadProfileImage = multer({
  storage: createS3Storage('devotees/'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('profileImage');

const uploadEventImage = multer({
  storage: createS3Storage('events/'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');

/** Only run multer when Content-Type is multipart (optional profile image for devotee update). */
const optionalUploadProfileImage = (req, res, next) => {
  const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
  if (!isMultipart) return next();
  uploadProfileImage(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed.',
      });
    }
    next();
  });
};

/** Only run multer when Content-Type is multipart (optional event image). */
const optionalUploadEventImage = (req, res, next) => {
  const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
  if (!isMultipart) return next();
  uploadEventImage(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed.',
      });
    }
    next();
  });
};

/** Only run multer when Content-Type is multipart (optional image for profile update). */
const optionalUploadImage = (req, res, next) => {
  const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
  if (!isMultipart) return next();
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed.',
      });
    }
    next();
  });
};

/**
 * Extract S3 object key from URL (virtual-hosted or path-style).
 */
function getKeyFromS3Url(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.replace(/^\//, '');
    const bucket = process.env.S3_BUCKET_NAME;
    // Path-style: /bucket/key -> key; virtual-hosted: /key
    if (bucket && pathname.startsWith(bucket + '/')) {
      return pathname.substring(bucket.length + 1);
    }
    return pathname;
  } catch (e) {
    return null;
  }
}

async function deleteFileFromS3(url) {
  if (!url) return;
  const key = getKeyFromS3Url(url);
  if (!key) return;
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (err) {
    console.error('Error deleting file from S3:', err.message);
  }
}

module.exports = {
  uploadImage,
  optionalUploadImage,
  optionalUploadEventImage,
  optionalUploadProfileImage,
  deleteFileFromS3,
};


const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 4, fields: 1, fieldSize: 100000 },
  fileFilter(req, file, cb) {
    if (!['image/jpeg','image/png','image/webp'].includes(file.mimetype)) return cb(Object.assign(new Error('Use JPEG, PNG or WebP photos.'), { status: 422 }));
    cb(null, true);
  }
}).array('images', 4);
module.exports = (req, res, next) => upload(req, res, error => {
  if (error) return res.status(422).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be 5 MB or smaller.' : error.message });
  next();
});

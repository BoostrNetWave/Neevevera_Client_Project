export function errorHandler(err, req, res, next) {
  console.error({
    message: err.message,
    path: req.path,
    method: req.method,
    user: req.user?._id,
    stack: err.stack,
  });

  // Multer errors
  if (err.name === 'MulterError') {
    const map = {
      LIMIT_FILE_SIZE: 'File exceeds the allowed size for this upload type.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field — check the form field name matches the API.',
    };
    return res.status(400).json({ error: map[err.code] || 'File upload error.' });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed.', details: messages });
  }

  // Mongoose duplicate key (e.g. slug collision)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `${field} "${err.keyValue[field]}" is already in use.` });
  }

  // Invalid ObjectId in a route param
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}.` });
  }

  // Cloudinary errors (identifiable by http_code property on the error object)
  if (err.http_code) {
    return res.status(502).json({ error: 'Media upload service error. Please retry.' });
  }

  // Fallback — never leak a raw stack trace to the client
  res.status(err.statusCode || 500).json({ error: 'Something went wrong. Please try again.' });
}

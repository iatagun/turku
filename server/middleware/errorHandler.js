class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Kaynak bulunamadı.') {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Geçersiz istek.') {
    super(message, 400);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Çakışma.', data = {}) {
    super(message, 409);
    this.data = data;
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Bu işlem için yetkiniz yok.') {
    super(message, 403);
  }
}

// Route handler'ları try/catch'ten kurtaran wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Global error handler middleware
function errorHandler(err, req, res, _next) {
  if (err.isOperational) {
    const response = { error: err.message };
    if (err.data) Object.assign(response, err.data);
    return res.status(err.statusCode).json(response);
  }

  console.error('Beklenmeyen hata:', err);
  res.status(500).json({ error: 'Sunucu hatası oluştu.' });
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  ForbiddenError,
  asyncHandler,
  errorHandler,
};

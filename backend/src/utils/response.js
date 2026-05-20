export const successResponse = (res, data = {}, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data })

export const errorResponse = (res, message = 'Something went wrong', statusCode = 500, errors = null) =>
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  })

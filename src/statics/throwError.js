import requiredParam from './requiredParam';

const throwError = (
  message = requiredParam('message'),
  stacktraceFunction = requiredParam('stacktraceFunction'),
) => {
  const error = new Error(message);
  if (typeof Error.captureStackTrace === 'function') {
    Error.captureStackTrace(error, stacktraceFunction);
  }
  throw error;
};

export default throwError;

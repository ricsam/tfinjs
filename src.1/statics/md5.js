import crypto from 'crypto';

const md5 = (what) =>
  crypto
    .createHash('md5')
    .update(what)
    .digest('hex');

export default md5;

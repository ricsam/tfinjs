import requiredParam from './statics/requiredParam';
import throwError from './statics/throwError';

const isPrimitive = (val) =>
  ['string', 'boolean', 'number'].includes(typeof val);

const parsePrimitive = (val) => {
  switch (typeof val) {
    case 'string':
      return `"${val}"`;
    case 'number':
      return val;
    case 'boolean':
      return val ? 'true' : 'false';
    default:
      break;
  }
  return val;
};

/**
 * Converts JavaScript to HCL
 *
 * @class JsToHcl
 */
class JsToHcl {
  /**
   * Converts a javascript object or array to HCL
   *
   * @param {object|array} js
   * @returns hcl
   * @memberof JsToHcl
   */
  stringify(js) {
    const hcl = this.parse(js);
    return hcl
      .replace(/^\{/, '')
      .replace(/\}$/, '');
  }

  /**
   * converts any javascript type to hcl
   *
   * @returns hcl
   * @memberof JsToHcl
   */
  parse = (value = requiredParam('value')) => {
    if (typeof value === 'undefined' || value === null || Number.isNaN(value)) {
      throwError('Value cannot be null, undefined or NaN', this.parseNonPrimitive);
    }
    if (isPrimitive(value)) {
      return parsePrimitive(value);
    }
    if (Array.isArray(value)) {
      return `[
        ${value.map(this.parse).sort().join(',\n')}
      ]`;
    }
    return `{
      ${Object.entries(value)
      .map(this.createHclKeyVal)
      .sort()
      .join('\n')}
    }`;
  };

  /**
   * Creates key value pair in hcl
   *
   * @param {array} params [
   * @param {string} params[0] - key
   * @param {string} params[0] - value
   * @returns hcl
   */
  createHclKeyVal = ([
    key = requiredParam('key'),
    value = requiredParam('value'),
  ]) => {
    const parsedValue = this.parse(value);
    return `${key} = ${parsedValue}`;
  };
}

export default JsToHcl;

import requiredParam from './statics/requiredParam';

class JsToHcl {
  stringify(js) {
    const hcl = this.parse(js);
    return hcl;
  }

  parse = (value = requiredParam('value')) => {
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return `[
        ${value.map(this.arrayItemString).join(',\n')}
      ]`;
    }
    return `{
      ${Object.entries(value)
      .map(this.keyValEnum)
      .join('\n')}
    }`;
  };

  keyValEnum = ([
    key = requiredParam('key'),
    value = requiredParam('value'),
  ]) => {
    let parsedValue;
    if (typeof value === 'object') {
      parsedValue = this.parse(value);
    } else if (typeof value === 'string') {
      parsedValue = `"${value}"`;
    } else if (typeof value === 'number') {
      parsedValue = value;
    } else if (typeof value === 'boolean') {
      parsedValue = value ? 'true' : 'false';
    }
    return `${key} = ${parsedValue}`;
  };

  arrayItemString = (ival) => {
    let val;
    if (typeof ival !== 'string') {
      val = this.parse(ival);
    } else {
      val = `"${ival}"`;
    }
    return val;
  };
}

export default JsToHcl;

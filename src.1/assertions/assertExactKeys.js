const assertExactKeys = (props, keys) => {
  const propsKeys = Object.keys(props).sort();
  if (
    propsKeys.length !== keys.length
    || !keys.sort().every((key, index) => key === propsKeys[index])
  ) {
    const error = new Error('The keys does not match');
    throw error;
  }
};

export default assertExactKeys;

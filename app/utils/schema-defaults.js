'use strict';

function defaults(schema) {
  if (schema.default) return schema.default;

  if (schema.enum && schema.enum.length > 0) return schema.enum[0];

  const type = schema.type;
  if (type === 'string' || type === 'password') return '';
  else if (type === 'integer' || type === 'number') return 0;
  else if (type === 'array') return [];
  else if (type === 'object') {
    const obj = {};
    const properties = schema.properties;
    if (properties === undefined) return obj;

    for (const prop in properties) {
      const propSchema = properties[prop];
      const propDefaults = defaults(propSchema);
      obj[prop] = propDefaults;
    }

    return obj;
  } else if (type === 'boolean') {
    return schema.default !== undefined ? schema.default : null;
  }

  return null;
}

module.exports = defaults;

'use strict';

const { isArray } = require('../types/detector');
const { includes, keys, forEach } = require('lodash');

const cls = function (schema, { isArray = false }) {
  this.isArray = isArray;
  this.schema = schema;
  this.normalize = normalizeValue;
  this.serialize = serializeValue;
  this.deserialize = deserializeValue;
};

/**
 * Resolving type handler, if user didn't execute the function
 * it will be auto initialized
 * @param {*} typehandler
 */
const initiateTypeHandler = typehandler => {
  if (includes(keys(typehandler), 'parse')) {
    return typehandler;
  } else {
    return typehandler();
  }
};

const normalizeValue = function (valuesToNormalize) {
  if (this.isArray && !isArray(valuesToNormalize)) {
    throw new TypeError('Wrong value type, you must supply array values!');
  }

  const normalize = (objValue, schema) => {
    const normalized = {};
    const errorResults = {};

    forEach(schema, (typeHandler, key) => {
      const handler = initiateTypeHandler(typeHandler);
      const [fail, normalizedValue] = handler.parse(key, objValue[key]);
      if (!fail || (fail && !handler.isHideOnFail())) {
        normalized[key] = normalizedValue;
      }

      if (fail) errorResults[key] = `failed to parse ${key} as a String type`;
    });

    return [errorResults, normalized];
  };

  if (!this.isArray) {
    const [errors, normalizedResult] = normalize(
      valuesToNormalize,
      this.schema
    );
    return [keys(errors).length > 0, errors, normalizedResult];
  } else {
    const results = valuesToNormalize.map(v => normalize(v, this.schema));
    const allErrors = [];
    const normalizedResults = [];

    forEach(results, ([errors, normalized]) => {
      if (errors.length > 0) allErrors.push(errors);
      normalizedResults.push(normalized);
    });

    return [allErrors.length > 0, allErrors, normalizedResults];
  }
};

const serializeValue = function (valuesToSerialize) {
  const serialized = {};
  const [isError, errorDetails, normalizedValues] = this.normalize(
    valuesToSerialize
  );

  const normalizedKeys = Object.keys(normalizedValues);
  forEach(this.schema, (typeHandler, key) => {
    const handler = initiateTypeHandler(typeHandler);
    if (includes(normalizedKeys, key) && !handler.isHideOnSerialization()) {
      const serializeTo = handler.getSerializeName();
      if (serializeTo !== null) {
        serialized[serializeTo] = normalizedValues[key];
      } else {
        serialized[key] = normalizedValues[key];
      }
    }
  });
  return [isError, errorDetails, serialized];
};

const deserializeValue = function (values) {
  // TODO: Check this.isArray type to treat values differently
  console.log(`Deserialize value processed with schema: ${this.schema}`);
  return [false, null, { deserializedkey1: 'fooo' }];
};

module.exports = {
  cls
};

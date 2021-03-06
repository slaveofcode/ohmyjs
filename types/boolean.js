'use strict';

const { isNil, difference, keys } = require('lodash');
const { combineDefaultOptions, fetchProvidedOptions } = require('./utils');
const { isArray, isObject, isBoolean, isString } = require('./detector');

const isValidObjectOptions = arg => {
  const options = keys(getOptions());
  const hasOptions = args =>
    difference(options, keys(args)).length < options.length;
  return isObject(arg) && hasOptions(arg);
};

const isValidArrayOptions = arg => isArray(arg) && arg.length > 0;

const isParamsValid = params => {
  if (isArray(params) && (params.length === 1 || params.length === 2)) {
    if (params.length === 1) {
      const objArg = params[0];
      return isValidArrayOptions(objArg) || isValidObjectOptions(objArg);
    } else if (params.length === 2) {
      if (isArray(params[0]) && isArray(params[1])) {
        return params[0].length > 0 && params[1].length > 0;
      } else if (isArray(params[0]) && isObject(params[1])) {
        return params[0].length > 0;
      }
    } else {
      return false;
    }
  }

  return false;
};

const extractValidList = params => {
  if (params.length === 0) return [];
  return isValidArrayOptions(params[0])
    ? params[0]
    : isValidObjectOptions(params[0]) && params[0].validList
      ? params[0].validList
      : [];
};

const extractInvalidList = params => {
  if (
    isArray(params) &&
    params.length > 0 &&
    !isObject(params[0]) &&
    params.length !== 2
  ) {
    return [];
  }

  return isValidArrayOptions(params[1])
    ? params[1]
    : isValidObjectOptions(params[0]) && params[0].invalidList
      ? params[0].invalidList
      : [];
};

const checkObjectPropertyExist = (params, propertyName) => {
  // Repeat over the length of params
  for (let i = 0; i < params.length; i++) {
    if (isObject(params[i]) && params[i].hasOwnProperty(propertyName)) {
      return params[i][propertyName];
    }
  }
  return null;
};

const isCaseSensitiveListing = params => {
  const caseSensitive = checkObjectPropertyExist(params, 'caseSensitive');
  return caseSensitive === null ? getOptions().caseSensitive : caseSensitive;
};

const isNotNil = params => {
  const normalizeNil = checkObjectPropertyExist(params, 'normalizeNil');
  return normalizeNil === null ? getOptions().normalizeNil : normalizeNil;
};

const evaluatesCondition = (value, validList, invalidList, caseSensitive) => {
  if (isBoolean(value)) return value;

  if (validList.length > 0) {
    if (!caseSensitive) {
      const validListLowerCased = validList.map(
        item => (isString(item) ? item.toLowerCase() : item)
      );
      validList = [...validList, ...validListLowerCased];
    }
    return validList.includes(value);
  } else if (invalidList.length > 0) {
    if (!caseSensitive) {
      const invalidListLowerCased = invalidList.map(
        item => (isString(item) ? item.toLowerCase() : item)
      );
      invalidList = [...invalidList, ...invalidListLowerCased];
    }
    return !invalidList.includes(value);
  }

  return null;
};

const parserMaker = (...params) => {
  if (params.length > 0 && !isParamsValid(params)) {
    throw new TypeError('Invalid setup for "bool" type');
  }

  return (key, value) => {
    let parsedVal = null;

    const validList = extractValidList(params);
    const invalidList = extractInvalidList(params);
    const isCaseSensitive = isCaseSensitiveListing(params);
    const normalizeNil = isNotNil(params);

    if (
      (!validList || validList.length === 0) &&
      (!invalidList || invalidList.length === 0) &&
      normalizeNil
    ) {
      return [isNil(value), !isNil(value)];
    }

    parsedVal = evaluatesCondition(
      value,
      validList,
      invalidList,
      isCaseSensitive
    );

    if (parsedVal === null && normalizeNil) {
      parsedVal = !isNil(value);
    }

    return [parsedVal === null, parsedVal];
  };
};

const validate = paramsOrOptions => {
  return (key, value, options) => {
    const errorDetails = [];
    let valid = true;

    const providedOptions = fetchProvidedOptions(getOptions(), options);
    let validList = providedOptions.validList;
    let invalidList = providedOptions.invalidList;

    if (!providedOptions.caseSensitive) {
      const validListLowerCased = validList && isArray(validList)
        ? validList.map(item => (isString(item) ? item.toLowerCase() : item))
        : [];
      const invalidListLowerCased = invalidList && isArray(invalidList)
        ? invalidList.map(item => (isString(item) ? item.toLowerCase() : item))
        : [];

      if (validListLowerCased.length > 0) {
        validList = [...validList, ...validListLowerCased];
      }

      if (invalidListLowerCased.length > 0) {
        invalidList = [...invalidList, ...invalidListLowerCased];
      }
    }

    if (
      (!validList || validList.length === 0) &&
      (!invalidList || invalidList.length === 0) &&
      providedOptions.normalizeNil
    ) {
      valid = valid && !isNil(value);

      if (!valid) {
        errorDetails.push(`Nil value indentified for "${key}"`);
      }
    }

    if (validList && validList.length > 0) {
      valid = valid && validList.includes(value);
    } else if (invalidList && invalidList.length > 0) {
      valid = valid && invalidList.includes(value);
    }

    if (!valid && isBoolean(value)) valid = true; // check for boolean type value

    return [errorDetails, valid];
  };
};

const getOptions = () =>
  combineDefaultOptions({
    validList: null,
    invalidList: null,
    caseSensitive: true,
    normalizeNil: false // doesn't effect if has validList and/or invalidList setup before
  });

const getTypeOptions = () => ({ isDirectValueSet: true });

module.exports = {
  getTypeOptions,
  parserMaker,
  validate,
  getOptions
};

'use strict';

/* eslint-disable */

const blueprint = require('../blueprint')
const types = require('../types')
const PodengError = require('../validator/errors/PodengError')

test('Object include float type', () => {
  const Obj = blueprint.object({
    num: types.float,
  })

  expect(typeof Obj).toEqual('function')
})

test('Validate value on wrong type passed', () => {
  const Obj = blueprint.object({
    num: types.float({ hideOnFail: true }),
    num2: types.float,
  })

  const Obj2 = blueprint.object({
    num: types.float({ min: 5.5 }),
  })

  const Obj3 = blueprint.object({
    num: types.float({ max: 100.050 }),
  })

  const Obj4 = blueprint.object({
    num: types.float({ min: 5.045, max: 17.5, default: 18.3 }),
  })

  const Obj5 = blueprint.object({
    number: types.float({
      minDigits: 2,
      maxDigits: 3,
    }),
  })

  expect(Obj({ num: {}, num2: '30.059' })).toEqual({ num2: 30.059 })
  expect(Obj({ num: {}, num2: '30.000' })).toEqual({ num2: 30 })
  expect(Obj({ num: {}, num2: 30.000 })).toEqual({ num2: 30 })
  expect(Obj({ num: {}, num2: 0 })).toEqual({ num2: 0 })
  expect(Obj2({ num: 20 })).toEqual({ num: 20 })
  expect(Obj2({ num: 20.20 })).toEqual({ num: 20.20 })
  expect(Obj2({ num: 'invalid' })).toEqual({ num: null })
  expect(Obj3({ num: 0 })).toEqual({ num: 0 })
  expect(Obj3({ num: '80.23' })).toEqual({ num: 80.23 })
  expect(Obj3({ num: '180.23' })).toEqual({ num: null })
  expect(Obj3({ num: '10.3235' })).toEqual({ num: 10.3235 })
  expect(Obj4({ num: '5.045' })).toEqual({ num: 5.045 })
  expect(Obj4({ num: '17.5' })).toEqual({ num: 17.5 })
  expect(Obj4({ num: {} })).toEqual({ num: 18.3 })
  expect(Obj4({ num: 5 })).toEqual({ num: 18.3 })
  expect(Obj4({ num: 20 })).toEqual({ num: 18.3 })
  expect(Obj5({ number: '27' })).toEqual({ number: 27 })
  expect(Obj5({ number: '9' })).toEqual({ number: null })
  expect(Obj5({ number: '9.5' })).toEqual({ number: null })
  expect(Obj5({ number: '1000' })).toEqual({ number: null })
  expect(Obj5({ number: '100.04' })).toEqual({ number: 100.04 })
})

test('Object array with float options', () => {
  const Obj = blueprint.object({
    value1: types.float,
    value2: types.float({ min: 10.18 }),
  })

  const Collections = blueprint.array(Obj)

  expect(
    Collections([
      { value1: 33.2, value2: '33' },
      { value1: '10.19', value2: 10.19 },
      { value1: 11, value2: 5 },
      { value1: '4.12', value2: '88.18' },
    ])
  ).toEqual([
    {
      value1: 33.2,
      value2: 33,
    },
    { value1: 10.19, value2: 10.19 },
    { value1: 11, value2: null },
    { value1: 4.12, value2: 88.18 },
  ])
})

test('Object include float with validation', () => {
  const Obj1 = blueprint.object(
    {
      value: types.float,
    },
    { throwOnError: true }
  )

  const Obj2 = blueprint.object(
    {
      value: types.float,
    },
    { throwOnError: new TypeError('The Value Error') }
  )

  const Obj3 = blueprint.object(
    {
      value: types.float,
    },
    { onError: TypeError('The Invalid onError value') }
  )

  const Obj4 = blueprint.object(
    {
      value: types.float,
    },
    {
      onError: {
        onKey: (key, err) => {
          throw new TypeError('Error coming from onKey')
        },
      },
    }
  )

  const Obj5 = blueprint.object(
    {
      value: types.float,
    },
    {
      onError: {
        onAll: errors => {
          throw new TypeError('Error coming from onAll')
        },
      },
    }
  )

  const Obj6 = blueprint.object({
    someKey: types.float({ min: 'abc' }),
  })
  const Obj7 = blueprint.object({
    someKey: types.float({ max: 'abc' }),
  })
  const Obj8 = blueprint.object({
    someKey: types.float({ minDigits: 'abc' }),
  })
  const Obj9 = blueprint.object({
    someKey: types.float({ maxDigits: 'abc' }),
  })

  const willThrow = obj => {
    return () => {
      obj.call(null, {
        value: function () { },
      })
    }
  }

  expect(willThrow(Obj1)).toThrow(PodengError)
  expect(willThrow(Obj2)).toThrow(TypeError)
  expect(willThrow(Obj3)).not.toThrow()
  expect(willThrow(Obj4)).toThrow(TypeError('Error coming from onKey'))
  expect(willThrow(Obj5)).toThrow(TypeError('Error coming from onAll'))
  expect(() => Obj6({ someKey: '123.23' })).toThrow(
    TypeError(
      'Float: Invalid "min" option value for someKey, it should be in numeric type!'
    )
  )
  expect(() => Obj7({ someKey: '123.23' })).toThrow(
    TypeError(
      'Float: Invalid "max" option value for someKey, it should be in numeric type!'
    )
  )
  expect(() => Obj8({ someKey: '123.23' })).toThrow(
    TypeError(
      'Float: Invalid "minDigits" option value for someKey, it should be in numeric type!'
    )
  )
  expect(() => Obj9({ someKey: '123.23' })).toThrow(
    TypeError(
      'Float: Invalid "maxDigits" option value for someKey, it should be in numeric type!'
    )
  )
})

test('Will validate using custom value', () => {
  const Obj = blueprint.object({
    value: types.float({
      validate: val => val > 100,
    }),
  })

  const Obj2 = blueprint.object({
    value: types.float({
      validate: val => val !== 1818,
      default: () => 9999,
    }),
  })

  expect(Obj({ value: '80.23' })).toEqual({ value: null })
  expect(Obj({ value: '220.21' })).toEqual({ value: 220.21 })
  expect(Obj2({ value: 'abc' })).toEqual({ value: 9999 })
  expect(Obj2({ value: 1818 })).toEqual({ value: 9999 })
})

test('Ignore null value', () => {
  const Obj = blueprint.object({
    value: types.float,
  })

  expect(Obj({ value: null })).toEqual({ value: null })
})
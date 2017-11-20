/*!
 * mongoose-dummy
 * Mongoose dummy objects generator
 */


const flat = require('flat');
const lodash = require('lodash');
const unflatten = flat.unflatten;
const faker = require('faker');
const mongoose = require('mongoose');
const hasKey  = lodash.has;

/**
 * getPaths(model)
 *
 * Extracts all paths and defintion from mongoose schema
 *
 * @param {MongooseSchmea} model The model schema object
 *
 * Returns an object for paths definition with the following format:
 * {
 *   <path name>: <path description>
 * }
 * where path descrtiption is in the following format:
 * {
 *  required: Boolean <this path is required>,
 *  validators: Array <defined validation functions>,
 *  default: Mixed <default path value>,
 *  isEnum: Boolean <if path only accepts enumerations>,
 *  enum: Array <path enumration if isEnum>,
 *  isPathDef: Boolean <if it is a path definition object>,
 *  lowercase: Boolean <lowercase filter>,
 *  uppercase: Boolean <uppercase filter>,
 *  trim: Boolean <trim text filter>,
 *  max: Number <Maximum value if has maximum>,
 *  min: Number <Minimum value if has minimum>,
 *  isArray: Boolean <if the path is an array>
 *  arrayDefinition: Object <Path Definition Object for array element>
 *  ref: String <Referenced object if has reference>
 * }
 */
let getPaths = (model) => {
  let res = {}; /* Final return element */
  let _generateReturnObj = (path, name, schema, context) => { /* Generate definition for a single path */
    let result = {
      type: path.instance,
      required: !!path.isRequired,
      validators: path.validators,
      default: path.defaultValue,
      isEnum: Array.isArray(path.enumValues) && path.enumValues.length,
      enum: path.enumValues,
      isPathDef: true,
      lowercase: !!path.options.lowercase,
      uppercase: !!path.options.uppercase,
      trim: !!path.options.trim
    };
    if (Array.isArray(path.validators)) {
      path.validators.forEach(val => {
        if (val.type === "max") {
          result.max = val.max;
        }
        if (val.type === "min") {
          result.min = val.min;
        }
      });
    }
    if (path.instance.toLowerCase() === "array") { /* Recurse the function for array element definitions */
      result.isArray = true;
      if (!path.schema) {
        result.arrayDefinition = _generateReturnObj(path.caster);
      } else {
        result.arrayDefinition = getPaths(path.schema);
      }
    }
    if (path.instance.toLowerCase() === "objectid" && path.options.ref) { /* Add referenced object */
      result.ref = path.options.ref;
    }
    return result
  }
  let _fillObject = function(name, schema, context) { /* Extract definition object from schema and path name */
    let path = schema.path(name);

    if (path) {
      return context[name] = _generateReturnObj(path, name, schema, context);
    }
  }

  /* Loop over paths and extract definitions */
  if (model.schema) {
    model.schema.eachPath(function(path) {
      _fillObject(path, model.schema, res);
    });
  } else {
    model.eachPath(function(path) {
      _fillObject(path, model, res);
    });
  }

  return res;
}

/**
 * generateRandomModel(paths, opts)
 *
 * Extracts all paths using getPaths() then generate random object from these paths
 *
 * @param {Object} paths Path definitions generated from getPaths()
 * @param {Object} opts Dummy object generation options
 * format of opts:
 * {
 *  ignore: Array (paths to ignore during generation),
 *  autoDetect: Boolean (attempt to detect string types. For example, email, password, etc.),
 *  applyFilter: Boolean (apply filters on string types if they are provide on the path),
 *  returnDate: Boolean (weather to return dates as Date or String),
 *  custom: Object (overrides to generated values)
 * }
 * Returns the generated dummy object
 */
let generateRandomModel = (paths, opts) => {
  let generated = {};

  if (opts == null) {
    opts = {};
  }

  if (opts.autoDetect == null) {
    opts.autoDetect = true;
  }

  if (opts.applyFilter == null) {
    opts.applyFilter = true;
  }

  for (let field in paths) { /* Loop over paths and generated data */
    if (opts.ignore && opts.ignore.indexOf(field) !== -1) { /* Ignore paths in opts.ignore */
      continue;
    }
    let desc = paths[field];
    if (desc.isEnum) { /* Handle enumerations paths */
      let randomIndex = Math.round((Math.random() * (desc.enum.length - 1)));
      generated[field] = desc.enum[randomIndex];
    } else {
      let type = desc.type.toLowerCase();

      if (type === "string") {
        if (opts.autoDetect) { /* Attempt to detect e-mail, password, or phone */
          if (/e?\-?mail/mi.test(field)) {
            generated[field] = faker.internet.email();
          } else if (/password/mi.test(field)) {
            generated[field] = faker.name.firstName() + faker.name.lastName() + Math.random() + "_";
          } else if (/phone/mi.test(field)) {
            generated[field] = faker.phone_number.phoneNumber();
          } else {
            generated[field] = faker.internet.userName();
          }
        } else {
          generated[field] = faker.internet.userName(); /* Default string generation */
        }
        if (opts.applyFilter && desc.lowercase) {  /* Handle lowercase filter */
          generated[field] = generated[field].toLowerCase();
        }
        if (opts.applyFilter && desc.uppercase) { /* Handle uppercase filter */
          generated[field] = generated[field].toUpperrCase();
        }
        if (opts.applyFilter && desc.trim) { /* Handle trim filter */
          generated[field] = generated[field].trim();
        }
      } else if (type === "number") { /* Default number generation*/
        generated[field] = faker.random.number(desc.max || 80);
      } else if (type === "date") {
        generated[field] = faker.date.recent();
        if (!opts.returnDate) {
          generated[field] = generated[field].toString();
        }
      } else if (type === "boolean") {
        generated[field] = Math.random() < 0.5 ? false : true;
      } else if (type === "mixed") { /* Handle mixed objects */
        generated[field] = {};
        let firstCity = faker.random.locale();
        let secondCity = faker.random.locale();
        generated[field][firstCity] = faker.helpers.createCard();
        generated[field][secondCity] = faker.helpers.createCard();
      } else if (type === "objectid"){ /* Handle ObjectId*/
        if (desc.ref) {
          generated[field] = mongoose.Types.ObjectId().toString()
        } else {
          generated[field] = mongoose.Types.ObjectId().toString()
        }
      } else if (type === "array"){ /*Handle array recursively */
        generated[field] = [];
        for (let i = 0; i < faker.random.number(15); i++) {
          let arrayDef = desc.arrayDefinition;
          if (arrayDef.isPathDef) {
            generated[field].push(generateRandomModel({generate: desc.arrayDefinition}, opts).generate); /* Handle arrays with primitives */
          } else {
            generated[field].push(generateRandomModel(desc.arrayDefinition, opts)); /* Handle arrays with defined objects */
          }
        }
      } else {
        throw ("Unsupported type " + type)
      }
    }
  }

  if (opts.custom) {
    for (let key of Object.keys(opts.custom)) {
      if (hasKey(generated, key)) {
        generated[key] = opts.custom[key];
      }
    }
  }
  
  return unflatten(generated); /* Unflatten dot notation */
};

/**
 * generateObject(model, save, opts)
 *
 * Extracts all paths using getPaths() then generate random object from these paths. 
 * 
 *
 * @param {MongooseSchmea} model The model schema object
 * @param {Boolean} save Whether to persist generated object to mongodb
 * @param {Object} opts Options object passed to generateRandomModel()
 *
 * Returns a promise
 */
let generateObject = async (model, save = true, opts = {}) => {
  let paths = getPaths(model);
  let obj = generateRandomModel(paths, opts);

  if (save) {
    await model.create(obj);
  }

  return obj;
}

module.exports = {
  getPaths,
  generateRandomModel,
  generateObject
};

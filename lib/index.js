/*!
 * mongoose-dummy
 * Mongoose dummy objects generator
 */


const flat = require('flat');
const unflatten = flat.unflatten;
const faker = require('faker');
const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.ObjectId;

/**
 * getPaths(model)
 *
 * Extracts all paths and defintion from mongoose schema
 *
 * @param {MongooseSchmea} model The model schema object
 * @param {object} opts Options
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
let getPaths = (model, opts = {}) => {
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
        if (path.instance) {
            if (path.instance.toLowerCase() === "array") { /* Recurse the function for array element definitions */
                result.isArray = true;
                if (!path.schema) {
                    result.arrayDefinition = _generateReturnObj(path.caster);
                } else {
                    result.arrayDefinition = getPaths(path.schema, opts);
                }
            }
            if (path.instance.toLowerCase() === "objectid" && path.options.ref) { /* Add referenced object */
                result.ref = path.options.ref;
            }
        } else { // Virtual field
            if (opts.maxDepth > 1 && path.options.justOne === false) {
                result.type = "Array";
                result.isArray = true;
                let arraySchema = require(opts.resolveRef(path.options.ref));
                let newOpts = Object.assign({}, opts, { maxDepth: opts.maxDepth - 1 });
                result.arrayDefinition = getPaths(arraySchema, newOpts);
            } else {
                result.type = "ObjectId";
                result.ref = path.options.ref;
            }
        }
        return result
    }
    let _fillObject = function(name, schema, context, virtual) { /* Extract definition object from schema and path name */
        let path;
        if (virtual) {
            path = schema.virtualpath(name);
        } else {
            path = schema.path(name);
        }

        if (path) {
            return context[name] = _generateReturnObj(path, name, schema, context);
        }
    }

    /* Loop over paths and extract definitions */
    if (model.schema) {
        model.schema.eachPath(function (path) {
            _fillObject(path, model.schema, res);
        });

        if ((model.schema.options.toJSON && model.schema.options.toJSON.virtuals) ||
            (model.schema.options.toObject && model.schema.options.toObject.virtuals)) {
            Object.keys(model.schema.virtuals).forEach((path) => {
                _fillObject(path, model.schema, res, true);
            });
        }
    } else {
        model.eachPath(function (path) {
            _fillObject(path, model, res);
        });

        if ((model.options.toJSON && model.options.toJSON.virtuals) ||
            (model.options.toObject && model.options.toObject.virtuals)) {
            Object.keys(model.virtuals).forEach((path) => {
                _fillObject(path, model, res, true);
            });
        }
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
 *  autoDetect: Boolean (attempt to detect e-mail, phone, or password and generate corresponding random data, defaults to true),
 *  applyFilter: Boolean (apply lowercase, uppercase, and trim filters on generated object if defined in the path),
 *  returnDate: Boolean (weather to return dates as Date or String),
 *  custom: { (Special generator for specified fields)
 *     email: String (field to generate a random e-mail), Array of Strings (fields to generate a random e-mail), or Object {field: String or Array of String, value: Function (custom generator function)},
 *     phone: (Same as above but for phone),
 *     password: (Same as above but for password),
 *   },
 *   force: Object (paths to set it to certain values)
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

    let hasCustom = false;
    let customEmail, customPhone, customAddress, customPassword;

    /** Default custom generators */
    let emailGenerator = () => {
        return faker.internet.email();
    }
    let phoneGenerator = () => {
        return faker.phone.phoneNumber();
    }
    let addressGenerator = () => {
        return faker.address.streetAddress();
    }
    let passwordGenerator = () => {
        return faker.name.firstName() + faker.name.lastName() + Math.random() + "_";
    }

    if (opts.custom) { /* Check for custom fields */
        hasCustom = true;
        if (opts.custom.email) {
            if (typeof opts.custom.email === "string") {
                customEmail = [opts.custom.email]
            } else if (Array.isArray(opts.custom.email)) {
                customEmail = opts.custom.email
            } else if (typeof opts.custom.email === "object") {
                customEmail = opts.custom.email.field;
                if (typeof customEmail === "string") {
                    customEmail = [customEmail];
                }
                if (opts.custom.email.value) {
                    emailGenerator = opts.custom.email.value;
                }
            } else {
                throw new Error(`Invalid opts ${opts.custom.email}`);
            }
        }
        if (opts.custom.phone) {
            if (typeof opts.custom.phone === "string") {
                customPhone = [opts.custom.phone]
            } else if (Array.isArray(opts.custom.phone)) {
                customPhone = opts.custom.phone
            } else if (typeof opts.custom.phone === "object") {
                customPhone = opts.custom.phone.field;
                if (typeof customPhone === "string") {
                    customPhone = [customPhone];
                }
                if (opts.custom.phone.value) {
                    phoneGenerator = opts.custom.phone.value;
                }
            } else {
                throw new Error(`Invalid opts ${opts.custom.phone}`);
            }
        }
        if (opts.custom.address) {
            if (typeof opts.custom.address === "string") {
                customAddres = [opts.custom.address]
            } else if (Array.isArray(opts.custom.address)) {
                customAddres = opts.custom.address
            } else if (typeof opts.custom.address === "object") {
                customAddres = opts.custom.address.field;
                if (typeof customAddres === "string") {
                    customAddres = [customAddres];
                }
                if (opts.custom.address.value) {
                    addressGenerator = opts.custom.address.value;
                }
            } else {
                throw new Error(`Invalid opts ${opts.custom.address}`);
            }
        }
        if (opts.custom.password) {
            if (typeof opts.custom.password === "string") {
                customPassword = [opts.custom.password]
            } else if (Array.isArray(opts.custom.password)) {
                customPassword = opts.custom.password
            } else if (typeof opts.custom.password === "object") {
                customPassword = opts.custom.password.field;
                if (typeof customPassword === "string") {
                    customPassword = [customEmail];
                }
                if (opts.custom.password.value) {
                    passwordGenerator = opts.custom.password.value;
                }
            } else {
                throw new Error(`Invalid opts ${opts.custom.password}`);
            }
        }
    }

    for (let field in paths) { /* Loop over paths and generated data */
        const mustIgnore = opts.ignore && opts.ignore.findIndex(p => {
            if (typeof p === 'string')
                return field === p;
            else
                return p.test(field);
        }) !== -1;

        if (mustIgnore) { /* Ignore paths in opts.ignore */
            continue;
        }

        if(opts.force) {
          let key = Object.keys(opts.force).map(key => {
            if(field === key) {
              return key;
            }
          });
          if(key[0]) {
            generated[field] = opts.force[key[0]];
            continue;
          }
        }
        let desc = paths[field];
        if (desc.isEnum) { /* Handle enumerations paths */
            let randomIndex = Math.round((Math.random() * (desc.enum.length - 1)));
            generated[field] = desc.enum[randomIndex];
        } else {
            let type = desc.type.toLowerCase();
            if (hasCustom && type === "string") { /* Handle custom paths */
                let isCustom = false;
                if (opts.custom.email.indexOf(field) !== -1) {
                    generated[field] = emailGenerator();
                    isCustom = true;
                } else if (opts.custom.phone.indexOf(field) !== -1) {
                    generated[field] = phoneGenerator();
                    isCustom = true;
                } else if (opts.custom.address.indexOf(field) !== -1) {
                    generated[field] = addressGenerator();
                    isCustom = true
                } else if (opts.custom.password.indexOf(field) !== -1) {
                    generated[field] = passwordGenerator();
                    isCustom = true;
                }
                if (isCustom) {
                    if (opts.applyFilter && desc.lowercase) { /* Handle lowercase filter */
                        generated[field] = generated[field].toLowerCase();
                    }
                    if (opts.applyFilter && desc.uppercase) { /* Handle uppercase filter */
                        generated[field] = generated[field].toUpperrCase();
                    }
                    if (opts.applyFilter && desc.trim) { /* Handle trim filter */
                        generated[field] = generated[field].trim();
                    }
                    continue;
                }
            }
            if (type === "string") {
                if (opts.autoDetect) { /* Attempt to detect e-mail, password, or phone */
                    if (/e?\-?mail/mi.test(field)) {
                        generated[field] = faker.internet.email();
                    } else if (/password/mi.test(field)) {
                        generated[field] = faker.name.firstName() + faker.name.lastName() + Math.random() + "_";
                    } else if (/phone/mi.test(field)) {
                        generated[field] = faker.phone.phoneNumber();
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
            } else if (type === "objectid") { /* Handle ObjectId*/
                if (opts.maxDepth > 0 && desc.ref && opts.resolveRef) {
                    let subSchema = require(opts.resolveRef(desc.ref));
                    let newOpts = Object.assign({}, opts, { maxDepth: opts.maxDepth - 1 });
                    generated[field] = getPathsAndGenerate(subSchema, newOpts);
                } else {
                    generated[field] = mongoose.Types.ObjectId().toString()
                }
            } else if (type === "array") { /*Handle array recursively */
                generated[field] = [];
                for (let i = 0; i < faker.random.number(15); i++) {
                    let arrayDef = desc.arrayDefinition;
                    if (arrayDef.isPathDef) {
                        generated[field].push(generateRandomModel({ generate: desc.arrayDefinition }, opts).generate); /* Handle arrays with primitives */
                    } else {
                        generated[field].push(generateRandomModel(desc.arrayDefinition, opts)); /* Handle arrays with defined objects */
                    }
                }
            } else {
                throw ("Unsupported type " + type)
            }
        }
    }
    return unflatten(generated); /* Unflatten dot notation */
};

/**
 * getPathsAndGenerate(model, opts)
 *
 * Extracts all paths using getPaths() then generate random object from these paths
 *
 * @param {MongooseSchmea} model The model schema object
 * @param {Object} opts Options object passed to generateRandomModel()
 *
 * Returns the generated dummy object
 */
function getPathsAndGenerate(model, opts) {
    opts.maxDepth = opts.maxDepth === undefined ? 10 : opts.maxDepth;
    let paths = getPaths(model, opts);
    return generateRandomModel(paths, opts);
}

getPathsAndGenerate.getPaths = getPaths;

module.exports = getPathsAndGenerate;

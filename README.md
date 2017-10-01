# mongoose-dummy 1.0.0


mongoose-dummy is an automatic dummy object generator for mongoose using only the schema definition built for [Node.js](http://nodejs.org).

## Installation

  - Latest release:

        npm install mongoose-dummy
        
## Usage
### dummy(model, opts)
Generates dummy object from `model`
- `model`: Mongoose schema object
- `opts`: Generation options, where the options are in the following format:
```js
        {
          ignore: Array,
          autoDetect: Boolean,
          applyFilter: Boolean,
          returnDate: Boolean,
          custom: {
             email: [String, Array, Object],
             phone: [String, Array, Object],
             password: [String, Array, Object]
          }
        }
```
| Option | Type | Usage |
| :------: | ------ | ------ |
| ignore | Array | Paths to ignore during generation |
| autoDetect | Boolean | Attempt to detect e-mail, phone, or password and generate corresponding random data, defaults to true |
| applyFilter | Boolean | Apply lowercase, uppercase, and trim filters on generated object if defined in the path |
| returnDate | Boolean | Weather to return dates as Date or String |
| custom | Object | Special generator for specified fields |
| custom.email | String, Array, or Object | String (field to generate a random e-mails), Array of Strings (fields to generate a random e-mail), or Object `{field: String or Array of String, value: Function (custom generator function)}`
| custom.phone | String, Array, or Object | String (field to generate a random phones), Array of Strings (fields to generate a random phone), or Object `{field: String or Array of String, value: Function (custom generator function)}`
| custom.password | String, Array, or Object | String (field to generate a random passwords), Array of Strings (fields to generate a random password), or Object `{field: String or Array of String, value: Function (custom generator function)}`
----------

### dummy.getPaths(model)
Helper function to extract all paths definition from model.
## Usage Example
```js
const mongoose = require('mongoose');
const dummy = require('mongoose-dummy');
const ignoredFields = ['_id','created_at', '__v'];
let genderValues = ['Male', 'Female']
let schemaDefinition = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
    },
    birth_date: {
        type: Date
    },
    gender: {
        type: String,
        enum: genderValues
    },
    data: {
        type: Object,
        default: null
    },
    results: [
        {
            score: Number,
            course: Number
        }
    ],
    is_student: {
        type: Boolean
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});
let model = mongoose.model('Student', schemaDefinition);
let randomObject = dummy(model, {
    ignore: ignoredFields,
    returnDate: true
})
console.log(randomObject);

/* Result:
{
    "name": "lyda.renner84",
    "data": {
        "de_AT": {
            "name": "Josianne Bins",
            "email": "Camden24@yahoo.com",
            "phone": "198.514.9229 x60299",
            "posts": [{
                "words": "maxime quia sit",
                "sentence": "Fuga vel in architecto ut modi sequi aliquam debitis.",
                "sentences": "Reprehenderit ratione consequuntu.."
            }, {
                "words": "dignissimos qui qui",
                "sentence": "Eveniet est unde quis sit et ab.",
                "sentences": "Sit eos quaerat aut quisquam unde..",
                "paragraph": "Quasi et numquam cumque neque rerum aliquam ullam.."
            }],
            "address": {
                "geo": {
                    "lat": "25.9144",
                    "lng": "6.0991"
                },
                "city": "Amaraville",
                "state": "Indiana",
                "streetA": "O'Conner Prairie",
                "streetB": "5722 Shane Grove",
                "streetC": "8040 Hane Roads Suite 402",
                "streetD": "Apt. 816",
                "country": "Kenya",
                "zipcode": "74052"
            },
            "website": "garnett.net",
            "company": {
                "bs": "cross-platform facilitate deliverables",
                "name": "Morissette LLC",
                "catchPhrase": "Self-enabling intangible methodology"
            },
            "username": "Emanuel.Botsford37",
            "accountHistory": [{
                "amount": "473.69",
                "date": "2012-02-01T22:00:00.000Z",
                "business": "Lang, Hudson and Heller",
                "name": "Savings Account 3906",
                "type": "invoice",
                "account": "60253551"
            }, {
                "amount": "824.69",
                "date": "2012-02-01T22:00:00.000Z",
                "business": "Rice - Price",
                "name": "Credit Card Account 8924",
                "type": "withdrawal",
                "account": "62599733"
            }]
        }
        }
    },
    "email": "Lilian.Quigley@hotmail.com",
    "gender": "Male",
    "parent": "59d0ff689b95b02fec446c55",
    "results": [{
        "score": 61,
        "course": 51
    }, {
        "score": 38,
        "course": 63
    }],
    "birth_date": "2017-09-30T14:57:01.279Z",
    "is_student": true
}*/
```
## Testing
To run the test cases use `npm test`

#### License
Licensed under MIT

#### Author
A. Agiza developed at [The D. GmbH](https://thed.io)
Feel free to contact me [A. Agiza](mailto:ahmed.agiza@thed.io) and improve the code.

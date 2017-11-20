'use strict'
process.env.NODE_ENV = 'test';

const chai = require("chai");
const mongoose = require('mongoose');
const sinon = require('sinon');
const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;
const {
  getPaths,
  generateRandomModel,
  generateObject
} = require('../lib');

function validateEmail(email) {
  let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

const isObjectId = mongoose.Types.ObjectId.isValid;

const genderValues = ['Male', 'Female'];

const schemaDefinition = new mongoose.Schema({
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

const model = mongoose.model('Student', schemaDefinition);

describe('mongoose-dummy', () => {
  describe('generateObject', () => {
    it('should generate random object', async () => {
      const ignoredFields = ['_id','created_at', '__v'];

      let randomObject = await generateObject(model, false, {
        ignore: ignoredFields,
        returnDate: true
      });

      expect(randomObject).to.not.be.null;
      randomObject.name.should.be.a('string');
      randomObject.email.should.be.a('string');
      validateEmail(randomObject.email).should.be.true;
      randomObject.birth_date.should.be.a('date');
      genderValues.indexOf(randomObject.gender).should.not.eql(-1);
      randomObject.data.should.be.an('object');
      randomObject.results.should.be.an('array');
      randomObject.results[0].should.have.property('score');
      randomObject.is_student.should.be.a('boolean');
      isObjectId(randomObject.parent).should.be.true;
    });

    it('should save generated object if save=true', async () => {
      const createStub = sinon.stub(model, 'create').resolves();
      const randomObject = await generateObject(model, true);
      
      assert.isTrue(createStub.calledOnce);
      assert.isTrue(createStub.calledWith(randomObject));

      createStub.restore();
    });
  });

  describe('generateRandomModel', () => {
    it('should use provided custom values', () => {
      const custom = {
        name: 'Testttt'
      };

      const paths = getPaths(model);
      const randomObject = generateRandomModel(paths, {custom});

      assert.equal(randomObject.name, custom.name);
    });
  });
});

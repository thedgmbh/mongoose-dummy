'use strict'
process.env.NODE_ENV = 'test';

const chai = require("chai");
const mongoose = require('mongoose');
const should = chai.should();
const expect = chai.expect;
const dummy = require('..');
const isObjectId = mongoose.Types.ObjectId.isValid;

function validateEmail(email) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

describe('mongoose-dummy', () => {
    describe('generateRandomModel', () => {
        it('should generate random model', (done) => {
            const ignoredFields = ['_id', 'created_at', '__v', /detail.*_info/];
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
                detail: {
                    main_info: String,
                    some_info: String,
                    none_match: String
                },
                created_at: {
                    type: Date,
                    default: Date.now
                }
            });
            let model = mongoose.model('Student', schemaDefinition);
            let randomObject = dummy(model, {
                ignore: ignoredFields,
                returnDate: true,
                force: {
                  parent: '5af8a4f33f56930349d8f45b'
                }
            })
            expect(randomObject).to.not.be.null;
            randomObject.name.should.be.a('string');
            randomObject.email.should.be.a('string');
            randomObject.detail.none_match.should.be.a('string');
            validateEmail(randomObject.email).should.be.true;
            randomObject.birth_date.should.be.a('date');
            genderValues.indexOf(randomObject.gender).should.not.eql(-1);
            randomObject.data.should.be.an('object');
            randomObject.results.should.be.an('array');
            randomObject.results[0].should.have.property('score');
            randomObject.is_student.should.be.a('boolean');
            randomObject.parent.should.equal('5af8a4f33f56930349d8f45b')
            isObjectId(randomObject.parent).should.be.true;

            // Check ignore fields
            expect(randomObject.created_at).to.be.undefined;
            expect(randomObject._id).to.be.undefined;
            expect(randomObject.__v).to.be.undefined;
            expect(randomObject.detail.main_info).to.be.undefined;
            expect(randomObject.detail.some_info).to.be.undefined;

            done();
        });
    });
});

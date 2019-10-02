const mongoose = require("mongoose");
const { Schema } = mongoose;

const schema = new Schema({
	name: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	}
}, { toJSON: { virtuals: true }});

schema.virtual("books", {
	ref: "Book",
	localField: "_id",
	foreignField: "theme",
	justOne: false
});

module.exports = schema;

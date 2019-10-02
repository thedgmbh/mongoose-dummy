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
}, { toJSON: { virtuals: true } });

schema.virtual("briefcase", {
	ref: "BriefCase",
	localField: "_id",
	foreignField: "theme",
	justOne: true
});

module.exports = schema;

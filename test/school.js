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
	},
	sequel: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "School"
	}
});

module.exports = schema;

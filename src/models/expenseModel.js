const mongoose = require("mongoose")

const ExpenseSchema = new mongoose.Schema({
	expenseType: {
		type: String,
		required: true,
		trim: true
	},
	amount: {
		type: Number,
		required: true
	},
	mode: {
		type: String,
		trim: true,
		default: undefined
	},
	to: {
		type: String,
		trim: true,
		default: undefined
	},
	from: {
		type: String,
		trim: true,
		default: undefined
	},
	detail: {
		type: String,
		required: true,
		trim: true
	},
	billImage: {
		type: Buffer,
		default: undefined
	},
	status: {
		type: Boolean,
		default: undefined
	},
	employee: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "Employee"
	}
}, {
	timestamps: true
})

const Expense = mongoose.model("Expense", ExpenseSchema)

module.exports = Expense
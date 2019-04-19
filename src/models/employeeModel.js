const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const employeeSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	email: {
		type: String,
		unique: true,
		required: true,
		trim: true
	},
	password: {
		type: String,
		required: true,
		trim: true
	},
	designation: {
		type: String,
		trim: true,
		default: undefined
	},
	department: {
		type: String,
		trim: true,
		default: undefined
	},
	avatar: {
		type: Buffer,
		default: undefined	
	}
})

employeeSchema.methods.toJSON = function () {
	const employee = this

	const employeeObject = employee.toObject()

	delete employeeObject.password
	delete employeeObject.avatar

	return employeeObject
}

employeeSchema.statics.authenticate = async (email, password) => {
	const employee = await Employee.findOne({ email })

	if(!employee){
		return null
	}

	const isMatch = await bcrypt.compare(password, employee.password)

	if(!isMatch){
		return null
	}

	return employee
}

employeeSchema.pre("save", async function(next) {
	const employee = this

	if(employee.isModified("password"))
	{
		employee.password = await bcrypt.hash(employee.password, 8)
	}

	next()
})

const Employee = mongoose.model("Employee", employeeSchema)

module.exports = Employee
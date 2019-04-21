const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const adminSchema = new mongoose.Schema({
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
	}
})

adminSchema.methods.toJSON = function () {
	const admin = this

	const adminObject = admin.toObject()

	delete adminObject.password

	return adminObject
}

adminSchema.statics.authenticate = async (email, password) => {
	const admin = await Admin.findOne({ email })

	if(!admin){
		return null
	}

	const isMatch = await bcrypt.compare(password, admin.password)

	if(!isMatch){
		return null
	}

	return admin
}

adminSchema.pre("save", async function(next) {
	const admin = this

	if(admin.isModified("password"))
	{
		admin.password = await bcrypt.hash(admin.password, 8)
	}

	next()
})

const Admin = mongoose.model("Admin", adminSchema)

module.exports = Admin
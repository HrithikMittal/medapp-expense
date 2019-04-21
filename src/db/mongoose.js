const mongoose = require("mongoose")

mongoose.connect("mongodb+srv://medapp-atlas:0wbEt1fjGZuj6sB7@cluster0-4dvih.mongodb.net/expenseApp?retryWrites=true", {
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false
})

const db = mongoose.connection

module.exports = db

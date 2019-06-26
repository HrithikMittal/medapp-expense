const mongoose = require("mongoose")

const remoteDB = "mongodb+srv://medapp-atlas:0wbEt1fjGZuj6sB7@cluster0-4dvih.mongodb.net/expenseApp?retryWrites=true"
const localDB = "mongodb://localhost:27017/expenseApp"
mongoose.connect(remoteDB, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false
})

const db = mongoose.connection

module.exports = db

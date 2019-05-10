const sharp = require("sharp")
const multer = require("multer")
const moment = require("moment")
const express = require("express")
const validator = require("validator")
const { decode } = require("he")
const Employee = require("../models/employeeModel")
const mongoose = require("mongoose")
const Expense = require("../models/expenseModel")
const { isEmployeeLoggedIn, isEmployeeLoggedOut } = require("../middleware/auth.js")
const { check, validationResult } = require("express-validator/check");

const uploadBill = multer({
	fileFilter (req, file, cb) {
		if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
			return cb(undefined, false)
		}

		cb(undefined, true)
	}
})

const uploadAvatar = multer({
	fileFilter (req, file, cb) {
		if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
			return cb(undefined, false)
		}

		cb(undefined, true)
	}
})

const router = new express.Router()

const title = {
	employeeLogin: "Login | Employee",
	employeeRegister: "Register | Employee",
	employeeDashboard: "Dashboard | Employee",
	employeeProfile: "Profile | Employee",
	employeeExpenses: "Expenses | Employee",
	employeeExpensesViewBy: "View Expense By | Employee",
	employeeAddExpense: "Add Expense | Employee"
}

router.get("/login", isEmployeeLoggedOut, (req, res) => {
	res.render("./employee/login", {
		pageTitle: title.employeeLogin,
		email: ""
	})
})

router.get("/register", isEmployeeLoggedOut, (req, res) => {
	res.render("./employee/register", {
		pageTitle: title.employeeRegister,
		name: "",
		email: ""
	})
})

router.post("/login", isEmployeeLoggedOut, [
		check("email").not().isEmpty().withMessage("Please provide Employee ID.").trim().escape(),
		check("password").not().isEmpty().withMessage("Please provide password.").trim().escape()
	], async (req, res) => {
		try {
			let email = req.body.email
			let password = req.body.password

			const errors = validationResult(req)

			if(!errors.isEmpty()){
				return res.render("./employee/login", {
					pageTitle: title.employeeLogin,
					errors: errors.array(),
					email
				})
			}


			if(!(validator.isEmail(email) || validator.isAlphanumeric(email))) {
				req.flash("danger", "Provide an email or ID")
				return res.redirect("/employee/login")
			}

			const employee = await Employee.authenticate(email, password)

			if(!employee){
				req.flash("danger", "Incorrect Employee ID or password!")
				return res.render("./employee/login", {
					pageTitle: title.employeeLogin,
					email: ""
				})
			}

			req.session.employee = employee

			res.redirect("/employee/dashboard")
		} catch(e) {
			res.status(400).send("Unable to login!\n" + e)
		}
})

router.post("/register", isEmployeeLoggedOut, [
		check("name").not().isEmpty().withMessage("Please provide employee name.").trim().escape(),
		check("email").not().isEmpty().withMessage("Please provide Employee ID.").trim().escape(),
		check("password").not().isEmpty().withMessage("Please provide password.").trim().escape(),
		check("confPassword").not().isEmpty().withMessage("Please confirm your password.").custom((value, {req}) => value === req.body.password).withMessage("Password does not match.").trim().escape()
	], async (req, res) => {
		try{
			let name = req.body.name
			let email = req.body.email
			let password = req.body.password

			const errors = validationResult(req)

			if(!errors.isEmpty()) {
				return res.render("./employee/register", {
					pageTitle: title.employeeRegister,
					name,
					email,
					errors: errors.array()
				})
			}

			if(!(validator.isEmail(email) || validator.isAlphanumeric(email))) {
				req.flash("danger", "Provide an email or ID")
				return res.redirect("/employee/register")
			}

			const employee = await Employee.findOne({ email })

			if(employee){
				req.flash("danger", "Employee ID exists, use another.")
				return res.render("./employee/register", {
					pageTitle: title.employeeRegister,
					name,
					email: ""
				})
			}
			const newEmployee = await new Employee({
				name,
				email,
				password
			})

			await newEmployee.save()

			delete newEmployee.password
			delete newEmployee.avatar

			req.session.employee = newEmployee

			res.redirect("/employee/dashboard")
		} catch(e) {
			res.status(400).send("Unable to register!\n" + e)
		}
})

router.get("/logout", isEmployeeLoggedIn, (req, res) => {
	req.session.destroy()
	res.redirect("/employee/login")
})

router.get("/dashboard", isEmployeeLoggedIn, (req, res) => {
	res.render("./employee/dashboard", {
		pageTitle: title.employeeDashboard
	})
})

router.get("/profile", isEmployeeLoggedIn, async (req, res) => {
	try {
		const employee = await Employee.findOne({ _id: req.session.employee._id })
		if(!employee) {
			req.flash("danger", "No such employee exists!")
			return res.redirect("/employee/dashboard")
		}
		res.render("./employee/profile", {
			pageTitle: title.employeeProfile,
			name: employee.name,
			email: employee.email,
			avatar: employee.avatar,
			bufferAvatar: employee.avatar,
			designation: employee.designation,
			department: employee.department
		})
	} catch(e) {
		res.status(500).send({
			error: "Something went wrong!",
			message: e
		})
	}
})

router.post("/profile", isEmployeeLoggedIn, uploadAvatar.single("avatar"), [
		check("name").not().isEmpty().withMessage("Please enter your name!").trim().escape(),
		check("email").isEmpty().withMessage("Email cannot be changed!").trim().escape(),
		check("designation").trim().escape(),
		check("department").trim().escape()
	], async (req, res) => {
		try {
			let name = req.body.name
			let designation = req.body.designation
			let department = req.body.department
			let email = req.session.employee.email
			let buffer

			const errors = validationResult(req)
			if(!errors.isEmpty())
			{
				return res.render("./employee/profile", {
					pageTitle: title.employeeProfile,
					errors: errors.array(),
					avatar: buffer,
					name,
					email,
					designation,
					department
				})
			}

			if(req.file) {
				 buffer = await sharp(req.file.buffer).resize({ width: 1024, height: 1024}).png().toBuffer()
			}

			const employee = await Employee.findOne({ _id : req.session.employee._id })

			if(!employee) {
				req.flash("danger", "No such employee exists!")
				return res.redirect("/employee/dashboard")
			}

			employee.name = name
			employee.designation = designation
			employee.department = department

			if(buffer) {
				employee.avatar = buffer
			}

			await employee.save()

			delete employee.password
			delete employee.avatar

			req.session.employee = employee

			req.flash("success", "Profile updated successfully!")
			res.redirect("/employee/profile")
		} catch(e) {
			res.status(400).send("Unable to update profile! " + e)
		}
})

router.get("/avatar", isEmployeeLoggedIn, async (req, res) => {
	try {
		const employee = await Employee.findById(req.session.employee._id)

		if(employee.avatar && req.query.size === "small") {
			employee.avatar = await sharp(employee.avatar).resize({ width: 500, height: 500}).toBuffer()
		}

		res.set("Content-Type", "image/png")
		res.send(employee.avatar)
	} catch(e) {
		res.sendStatus(500)
	}
})

router.get("/expenses/viewBy", isEmployeeLoggedIn, async (req, res) => {
	try {

		let monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
		let yearArray = []

		for(let y = moment().year(); y >= 2010; y--)
			yearArray.push(String(y))

		if(["month", "year"].includes(req.query.option)) {

			let viewBy = req.query.option
			let month = Number(req.query.month)
			let year = req.query.year
			let expression = {}

			if(viewBy === "month" && ( month >= 1 && month <= 12) && yearArray.includes(year)) {
				expression = {
					$and: [
						{$eq: [{$year: "$createdAt"}, Number(year)]},
						{$eq: [{$month: "$createdAt"}, month]}
					]
				}
			} else if(viewBy === "year" && yearArray.includes(year)) {
				expression = {
					$eq: [{$year: "$createdAt"}, Number(year)]
				}
			} else {
				req.flash("danger", "Invalid Operation!")
				return res.redirect("/employee/expenses/viewBy")
			}

			let expenses = await Expense.find({
				employee: req.session.employee,
				$expr: expression
			})

			res.render("./employee/expensesViewBy", {
				pageTitle: title.employeeExpensesViewBy,
				viewBy,
				month,
				monthName: monthArray[month - 1],
				year,
				monthArray,
				yearArray,
				expenses,
				decode
			})
		} else {
			res.render("./employee/expensesViewBy", {
				pageTitle: title.employeeExpensesViewBy,
				viewBy: "",
				month: "",
				monthName: "",
				year: "",
				monthArray,
				yearArray,
				expenses: ""
			})
		}
	} catch(e) {
		res.status(500).send(`<h3>Something went wrong!</h3><p>${e}</p>`)
	}
})

router.get("/expenses", isEmployeeLoggedIn, async (req, res) => {
	const expenses = await Expense.find({ employee: req.session.employee._id })

	res.render("./employee/expenses", {
		pageTitle: title.employeeExpenses,
		expenses,
		decode
	})
})

router.get("/expenses/add", isEmployeeLoggedIn, (req, res) => {

		let data = {
			pageTitle: title.employeeAddExpense,
			expenseType: req.params.type,
			amount: "",
			mode: "",
			to: "",
			from: "",
			detail: "",
			addExpense: true
		}

		res.render("./employee/addExpense", data)
})

router.get("/expenses/bill", isEmployeeLoggedIn, async (req, res) => {
	try {
		if(req.query.eid) {

			const expense = await Expense.findOne({ _id: req.query.eid, employee: req.session.employee._id }, "billImage")

			if(!expense) {
				return res.status(404).send("<h3>404</h3>")
			}

			res.set("Content-Type", "image/png")
			res.send(expense.billImage)
		}else {
			req.flash("danger", "Invalid operation!")
			return res.redirect("/employee/dashboard")
		}
	} catch(e) {
		res.status(500).send(e)
	}
})

router.post("/expenses/add", isEmployeeLoggedIn, uploadBill.single("billImage"), [
		check("expenseType").not().isEmpty().withMessage("Please select the expense type.").custom((value, {req}) => {
			if(["travel", "refreshment", "stationary", "emergency", "miscellaneous"].includes(req.body.expenseType)) {
				return true
			} else {
				req.body.expenseType = null
				return false
			}
		}).withMessage("Invalid expense type!").trim().escape(),
		check("amount").not().isEmpty().withMessage("Please enter the amount").custom((value) => Number(value)).withMessage("Invalid amount!"),
		check("mode").custom((value, { req }) => {
			if(req.body.expenseType === "travel") {
				if(req.body.mode && ["car", "bus", "flight", "train", "cab", ,"mo-bike", "other"].includes(req.body.mode)) {
					return true
				}else {
					throw new Error("Please select a mode of travel!")
				}
			}else {
				return true
			}
		}).trim().escape(),
		check("from").custom((value, { req }) => {
			if(req.body.expenseType === "travel") {
				if(req.body.from) {
					return true
				}else {
					throw new Error("Please enter value in 'from' field!")
				}
			}else {
				return true
			}
		}).trim().escape(),
		check("to").custom((value, { req }) => {
			if(req.body.expenseType === "travel") {
				if(req.body.to) {
					return true
				}else {
					throw new Error("Please enter value in 'to' field!")
				}
			}else {
				return true
			}
		}).trim().escape(),
		check("detail").not().isEmpty().withMessage("Please enter expense detail!").custom((value, {req}) => value.length < 200).withMessage("Detail can be maximum 200 characters.").trim().escape(),
	], async (req, res) => {
		try {
			let expenseType = req.body.expenseType
			let amount = req.body.amount
			let mode = req.body.mode
			let from = req.body.from
			let to = req.body.to
			let detail = req.body.detail

			if(!req.file){
				req.flash("danger", "Please upload a bill image!")
				return res.render("./employee/addExpense", {
					pageTitle: title.employeeAddExpense,
					expenseType,
					amount,
					mode,
					from,
					to,
					detail,
					addExpense: true
				})
			}

			let buffer = await sharp(req.file.buffer).resize({ width: 1024, height: 1024}).png().toBuffer()

			const errors = validationResult(req)

			if(!errors.isEmpty()){
				return res.render("./employee/addExpense", {
					pageTitle: title.employeeAddExpense,
					errors: errors.array(),
					expenseType,
					amount,
					mode,
					from,
					to,
					detail,
					addExpense: true
				})
			}

			const newExpense = new Expense({
				expenseType,
				amount,
				detail: detail.toLowerCase(),
				billImage: buffer,
				employee: req.session.employee._id
			})

			if(expenseType === "travel") {
				newExpense.mode = mode
				newExpense.from = from.toLowerCase()
				newExpense.to = to.toLowerCase()
			}

			await newExpense.save()

			req.flash("success", "Expense added successfully!")
			res.redirect("/employee/dashboard")
		} catch(e) {
			res.status(400).send(`<h3>Something went wrong!</h3><p>${e}</p>`)
		}
})
module.exports = router

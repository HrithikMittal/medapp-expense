const Employee = require("../models/employeeModel")
const Admin = require("../models/adminModel")

// Function to check whether the employee is logged in
async function isEmployeeLoggedIn (req, res, next) {
  try {
    if (!(req.session && req.session.employee)) {
      return res.redirect("/employee/login");
    }else {
      const employee = await Employee.findOne({ _id : req.session.employee._id })
      if(employee) {
        next();
      } else {
        req.session.employee = null;
        return res.redirect("/employee/login");
      }
    }
  } catch(e) {
    res.status(400).send("Something Went Wrong!" + e)
  }
}

// Function to check whether the employee is logged out
function isEmployeeLoggedOut (req, res, next) {
  if (req.session && req.session.employee) {
    return res.redirect("/employee/dashboard");
  }
  next();
}

// Function to check whether the admin is logged in
async function isAdminLoggedIn (req, res, next) {
  try {
    if (!(req.session && req.session.admin)) {
      return res.redirect("/medapp-expense-admin/login");
    }else {
      const admin = await Admin.findOne({ _id : req.session.admin._id })
      if(admin) {
        next();
      } else {
        req.session.admin = null;
        return res.redirect("/medapp-expense-admin/login");
      }
    }
  } catch(e) {
    res.status(400).send("Something Went Wrong!" + e)
  }
}

// Function to check whether the employee is logged out
function isAdminLoggedOut (req, res, next) {
  if (req.session && req.session.admin) {
    return res.redirect("/medapp-expense-admin/dashboard");
  }
  next();
}

module.exports = {
  isEmployeeLoggedIn,
  isEmployeeLoggedOut,
  isAdminLoggedIn,
  isAdminLoggedOut
}
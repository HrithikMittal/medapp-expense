const ejs = require("ejs")
const path = require("path")
const express = require("express")
const helmet = require("helmet")
const db = require("./db/mongoose.js")
const session = require("express-session")
const MongoStore = require("connect-mongo")(session)
const employeeRoute = require("./routes/employeeRoute")
const adminRoute = require("./routes/adminRoute")

const viewsPath = path.join(__dirname, "/views")

const app = express()

//set the development environment port
const port = process.env.PORT || 3000

app.enable('trust proxy');

if(process.env.NODE_ENV == "production")
{
  app.use((req, res, next) => {
    if(!req.secure) {
      res.redirect(`https://${req.headers.host}${req.url}`)
    }
    next()
  })
}

app.use(express.static(__dirname + "/../public"));

app.use(helmet())

app.use(express.urlencoded({ extended: true}))

//setup express-session middleware
app.use(session({
  secret: 'Xy12MIbneRt Un2w',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: true,
    expires: new Date(Date.now() + 60 * 60 * 1000)
  },
  store: new MongoStore({
    mongooseConnection: db
  })
}));

app.use((req, res, next) => {
  next()
})

//set the view engine to ejs
app.set("view engine", "ejs")
app.set("views", viewsPath)

//setup express-messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  res.locals.employee = req.session.employee
  next();
});

//setup global errors variable
app.locals.errors = null;

app.get("/", (req, res) => {
  res.render("index.ejs", {
    pageTitle: "Home | Expense App"
  })
})

app.use("/employee", employeeRoute)
app.use("/medapp-expense-admin", adminRoute)

//add the manifest
app.get("/manifest.json", function(req, res){
  //send the correct headers
  res.header("Content-Type", "text/cache-manifest");
  //console.log(path.join(__dirname,"manifest.json"));
  //send the manifest file
  //to be parsed bt express
  res.sendFile(path.join(__dirname,"../manifest.json"));
});

//add the service worker
app.get("/sw.js", function(req, res){
  //send the correct headers
  res.header("Content-Type", "text/javascript");

  res.sendFile(path.join(__dirname,"../sw.js"));
});

app.get("/loader.js", function(req, res){
  //send the correct headers
  res.header("Content-Type", "text/javascript");

  res.sendFile(path.join(__dirname,"../loader.js"));
});

app.listen(port, (req, res) => {
  console.log(`Server started at port ${port}..`)
})

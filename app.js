var express = require("express")
var path = require("path")
var cookieParser = require("cookie-parser")
var logger = require("morgan")

// var indexRouter = require("./routes/index")
// var usersRouter = require("./routes/users")
var cors = require("cors")

var app = express()

app.use(cors())
app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "chat-client/build")))

// app.use("/", indexRouter)
// app.use("/users", usersRouter)
app.get("/*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "chat-client/build", "index.html"))
})

module.exports = app

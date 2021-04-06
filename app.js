require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const userSchema =  new mongoose.Schema({
  email: String,
  password: String
});



userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields : ["password"]});

const User = new mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save((err) => {
    if (!err){
      res.render('secrets');
    } else {
      res.render(err);
    }
  });
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username}, (err, foundUser) => {
    if(err){
      console.log('ERROOORRRR', err);
    } else {
      if (foundUser) { 
        if (foundUser.password === password){ // if found then check if password is the same
          res.render('secrets');
        } else{
          res.send('INVALID PASSWORD');
        }
          
      }
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
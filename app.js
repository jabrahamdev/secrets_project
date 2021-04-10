require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    (accessToken, refreshToken, profile, cb) => {
      console.log("Profile reached", profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/secrets");
  }
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    console.log("req.isAuthenticated()", req.isAuthenticated());
    res.render("secrets");
  } else {
    console.log("req.isAuthenticated()", req.isAuthenticated());
    res.redirect("/login");
  }
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    console.log("req.isAuthenticated()", req.isAuthenticated());
    res.render("submit");
  } else {
    console.log("req.isAuthenticated()", req.isAuthenticated());
    res.redirect("/login");
  }
});

app.post('/submit', (req, res) => {
  const submittedSecret = req.body.secret;
  User.findById(req.user.id, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(() => {
          res.redirect('/secrets');
        });
      }
    }
  });

});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log("EERRRRROOOOOORRR", err);
        res.redirect("/register");
      } else {
        console.log("Within post/register");
        passport.authenticate("local")(req, res, function () {
          console.log("Within passport authenticate");
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        console.log("Within passport authenticate");
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

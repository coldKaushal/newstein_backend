const app = require("express")();
const bodyParser = require("body-parser");
const PORT = 8000;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("a");
});

const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://kaushal:kaushal007A@newstein.sipzkki.mongodb.net/newstein?retryWrites=true&w=majority",
    {
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.warn("db connection done");
  });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  preference: Object,
});

const preferenceSchema = new mongoose.Schema({
  email: String,
  location: String,
  search: Array,
  categories: Array,
  interaction: Array,
});

const User = new mongoose.model("User", userSchema);
const Preference = new mongoose.model("Preference", preferenceSchema);

app.post("/addUser", (req, res) => {
  console.log("Add User request");
  const data = req.body;
  const newUser = new User(data);
  newUser.save(function (err) {
    if (!err) {
      res.send("OK");
    } else {
      res.sendStatus("Not Okay");
    }
  });
});

app.post("/updateUser", (req, res) => {
  console.log(req.body);
  const email = req.body.email;
  User.find({ email: email }).remove(function (err) {
    if (err) {
      console.log(err);
      res.sendStatus(400);
    }
  });
  const newUser = new User(req.body);
  newUser.save(function (err) {
    if (!err) {
      res.sendStatus(200);
    } else {
      res.sendStatus(502);
    }
  });
});

app.post("/getUser", (req, res) => {
  const email = req.body.email;
  console.log(email);
  User.findOne({ email: email }, function (err, data) {
    if (!err) {
      //res.sendStatus(200);
      res.append("status", 200);
      if (data.length !== 0) {
        res.append("status", 200);
        res.send(data);
      } else {
        res.append("status", 400);
        res.send("no document found");
      }
    } else {
      res.append("status", 502);
      res.send();
    }
  });
});

app.post("/getCategories", (req, res) => {
  console.log("get category requested");

  const email = req.body.email;
  console.log(email);
  Preference.findOne({ email: email }, function (err, data) {
    if (!err) {
      if(data){
        console.log(data);
        res.send(data)
      }else{
        res.send("no data found");
      }
    } else {
      res.sendStatus(502);
    }
  });
});

app.post("/updateCategories", (req, res) => {
  console.log("update category requested");
  const email = req.body.email;
  const categories = req.body.categories;
  let userFound = false;
  console.log(categories);
  Preference.findOne({ email: email }, function (err) {
    if (!err) {
      userFound = true;
    }
  });
  if (!userFound) {
    const newPreference = new Preference({
      email: email,
      categories: categories,
    });
    newPreference.save(function (err) {
      if (!err) {
        res.send("added new preference");
      } else {
        res.send("err in adding new preference");
      }
    });
  } else {
    Preference.findOneAndUpdate(
      { email: email },
      { categories: categories },
      function (err, place) {
        if (!err) {
          res.send(place);
        } else {
          res.sendStatus(502);
        }
      }
    );
  }
});

app.post("/deleteAllUser", (req, res) => {
  User.deleteMany({}, function (err) {
    if (!err) {
      res.send("deleted");
    } else {
      res.send("error");
    }
  });
});

app.post("/deleteAllPreference", (req, res)=>{
  Preference.deleteMany({}, function(err){
    if(!err){
      res.send("deleted all preference");
    }else{
      res.send("err");
    }
  })
})

app.listen(PORT, () => {
  console.log("yea");
});

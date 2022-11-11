const app = require("express")();
const bodyParser = require("body-parser");
const PORT = 8000;
const dotenv = require("dotenv");
const axios = require("axios");
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

dotenv.config();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("a");
});

const mongoose = require("mongoose");

mongoose
  .connect(
    process.env.MONGODB_URL,
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
  Preference.findOneAndUpdate({email: email}, {categories: categories}, {upsert: true}, function(err){
    if(err){
      console.log(err);
      res.send(err);
    }else{
      res.send("added");
    }
  });
});


app.post("/getFullNews", (req, res)=>{
  const url = decodeURIComponent(req.body.url);
  console.log(url);
  axios.get(url).then(function(r2) {

    // We now have the article HTML, but before we can use Readability to locate the article content we need jsdom to convert it into a DOM object
    let dom = new JSDOM(r2.data, {
      url: url
    });

    // now pass the DOM document into readability to parse
    let article = new Readability(dom.window.document).parse();
    // console.log(article);
    // Done! The article content is in the textContent property
    // console.log(article.textContent);
    res.send(article.textContent);
  })
})

app.post("/getAllNews", (req, res)=>{
  axios.get("https://newsapi.org/v2/top-headlines?country=in&apiKey="+process.env.news_API).then(response=>{
  // console.log(response.data);  
  console.log("data fetched");
  res.send(response.data);
  }).catch(err=> {
    console.log(err.response.status);
    res.send(err.response.status);
  });
})

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

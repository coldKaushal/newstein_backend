const app = require("express")();
const bodyParser = require("body-parser");
const PORT = 8000;
const dotenv = require("dotenv");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const MonkeyLearn = require("monkeylearn");


dotenv.config();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  console.log("request");
  res.send("a");
});

const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URL, {
    useUnifiedTopology: true,
  })
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

const userDataSchema = new mongoose.Schema({
  email: String,
  likes: Array,
  dislikes: Array,
  bookmark: Array,
});
const newsSchema = new mongoose.Schema({
  author: String,
  title: String,
  description: String,
  url: String,
  urlToImage: String,
  publishedAt: String,
  category: String,
  likes: Number,
  dislikes: Number,
});

const News = new mongoose.model("News", newsSchema);
const User = new mongoose.model("User", userSchema);
const Preference = new mongoose.model("Preference", preferenceSchema);
const UserData = new mongoose.model("UserData", userDataSchema);
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
      // res.append("status", 200);
      console.log(data);
      if (data && data.length !== 0) {
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
      if (data) {
        console.log(data);
        res.send(data);
      } else {
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
  Preference.findOneAndUpdate(
    { email: email },
    { categories: categories },
    { upsert: true },
    function (err) {
      if (err) {
        console.log(err);
        res.send(err);
      } else {
        res.send("added");
      }
    }
  );
});

app.post("/getFullNews", (req, res) => {
  const url = decodeURIComponent(req.body.url);
  console.log(url);
  axios.get(url).then(function (r2) {
    let dom = new JSDOM(r2.data, {
      url: url,
    });
    let article = new Readability(dom.window.document).parse();
    // res.send(article.content);
    // console.log(article.textContent);
    res.send(article.textContent);
  });
});

app.post("/getAllNews", (req, res) => {
  // axios
  //   .get(
  //     "https://newsapi.org/v2/top-headlines?country=in&apiKey=" +
  //       process.env.NEWS_API
  //   )
  //   .then((response) => {
  //     console.log("data fetched successfully");
  //     res.send(response.data);
  //   })
  //   .catch((err) => {
  //     console.log(err.response.status);
  //     res.send(err.response.status);
  //   });
  console.log("get news requested");
  News.find({}, null, { limit: 1000 }, function (err, docs) {
    if (err) {
      // res.status(502);
      res.send("error");
    } else {
      // console.log(docs);
      if (docs && docs.length !== 0) {
        // res.status(200);
        res.send(docs);
      } else {
        // res.status(404);
        res.send("no news found");
      }
    }
  });
});

app.post("/addBookmark", (req, res) => {
  const data = req.body;
  console.log(data);
  UserData.updateOne(
    { email: data.email },
    { $addToSet: { bookmark: data.bookmark } },
    { upsert: true },
    function (err) {
      if (!err) {
        console.log("book mark added");
        res.send("bookmark added");
      } else {

        res.send("err");
      }
    }
  );
});

app.post("/fetchBookmark", (req, res) => {
  const data = req.body;
  UserData.findOne({ email: data.email }, function (err, data) {
    if (!err) {
      if(data && data.bookmark){
        res.send(data.bookmark);
      }else{
        res.send([]);
      }
    } else {
      res.send("error in fetching bookmark");
    }
  });
});

app.post("/like", (req, res) => {
  const data = req.body;
  const email = data.email;
  const _id = data._id;
  let prevLike = 0;
  News.findOne({ _id: _id }, null, function (err, docs) {
    if (err) {
      console.log("error");
      res.send("error");
    } else {
      if (docs && docs.length !== 0) {
        console.log(docs);
        prevLike = docs.likes;
        console.log(prevLike);
        News.findOneAndUpdate(
          { _id: _id },
          { likes: prevLike + 1 },
          { upsert: true },
          function (err) {
            if (err) {
              console.log(err);
              res.send(err);
            } else {
              console.log("article liked");
            }
          }
        );
      }
    }
  });
  
  UserData.findOneAndUpdate(
    { email: email },
    { $addToSet: { likes: _id } },
    { upsert: true },
    function (err) {
      if (!err) {
        res.send("like added");
      } else {
        res.send("err");
      }
    }
  );
});

app.post("/dislike", (req, res) => {
  const data = req.body;
  const email = data.email;
  const _id = data._id;
  let prevdislike = 0;
  News.findOne({ _id: _id }, null, function (err, docs) {
    if (err) {
      console.log("error");
      res.send("error");
    } else {
      if (docs && docs.length !== 0) {
        console.log(docs);
        prevdislike = docs.dislikes;
        console.log(prevdislike);
        News.findOneAndUpdate(
          { _id: _id },
          { dislikes: prevdislike + 1 },
          { upsert: true },
          function (err) {
            if (err) {
              console.log(err);
              res.send(err);
            } else {
              console.log("article disliked");
            }
          }
        );
      }
    }
  });
  
  UserData.findOneAndUpdate(
    { email: email },
    { $addToSet: { dislikes: _id } },
    { upsert: true },
    function (err) {
      if (!err) {
        res.send("dislike added");
      } else {
        res.send("err");
      }
    }
  );
});

app.post("/getNewsById", (req, res)=>{
  const _id = req.body._id;
  console.log(_id);
  News.findOne({_id: _id}, null, function(err, docs){
    if(err){
      res.send('error');
      console.log('error in fetching news by id');
    }else{
      if(docs){
        console.log("news fetched by id");
        res.send(docs)
      }else{
        console.log("no news by id found");
        res.send("error");
      }
    }
  })
})

app.post("/search", (req, res)=>{
  const text = req.body.text;
  News.find({title: {"$regex": text, "$options": "i"}}, function(err, docs){
    if(err){
      console.log("error while searching");
      res.send(err);
    }else{
      console.log(docs);
      res.send(docs);
    }
  })
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

app.post("/deleteAllPreference", (req, res) => {
  Preference.deleteMany({}, function (err) {
    if (!err) {
      res.send("deleted all preference");
    } else {
      res.send("err");
    }
  });
});





const ml = new MonkeyLearn("f490a97b629a7b1d1038e6fb7597679e266372e4");
let model_id = "cl_WDyr2Q4F";


app.post("/classify", (req, res)=>{
  console.log("data requested");
  const text= req.body.data;
  console.log(text);
  let data = [];
  data.push(text);
  ml.classifiers.classify(model_id, data).then((response) => {
    console.log(response.body.classification);
    const data = response.body;
    res.send(data);
  });
  // res.send(data);
})




let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port, function () {
  console.log("server has started at port " + port);
});

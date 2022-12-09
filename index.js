const app = require("express")();
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const axios = require("axios");

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

app.post("/fillDatabase", (req, res) => {
  axios
    .get(
      "https://newsapi.org/v2/top-headlines?country=in&apiKey=" +
        process.env.NEWS_API
    )
    .then((response) => {
      const articles = response.data.articles;
    //   res.send(articles);
      articles.forEach((item) => {
        console.log(item.publishedAt);
        // if(new Date(item.publishedAt)> new Date("2022-12-09T06:13:43Z")){
          const newNews = new News({
            author: item.author,
            title: item.title,
            description: item.description,
            url: item.url,
            urlToImage: item.urlToImage,
            publishedAt: item.publishedAt,
            category: '',
            likes: 0,
            dislikes: 0,
          });
          newNews.save(function(err){
              if(err){
                  res.send('error')
              } 
          });
        // }
      });
      res.send("db filled");
    })
    .catch((err) => {
      console.log(err.response.status);
      res.send(err.response.status);
    });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 9000;
}
app.listen(port, function () {
  console.log("server has started at port " + port);
});

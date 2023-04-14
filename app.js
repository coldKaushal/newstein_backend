require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const cors = require("cors");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));


app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

const url = process.env.MONGODB_URL;

mongoose.connect(url);

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const userInfoSchema = new mongoose.Schema({
    fname: String,
    lname: String,
    username: String,
    address1: String,
    address2: String,
    postalcode: String,
    mobile: String,
    country: String,
    state: String,
    favourites: Array,
    myRecipe: Array,
});
const recipeSchema = new mongoose.Schema({
    name: String,
    ingredients: Array,
    directions: Array,
    url: String,
    uniqueIngredients: Array,
    id: String,
    likes: Number,
    comments: Number,
    type: String,
    difficulty: String,
    time: String,
    usersLiked: Array,
    usersCommented: Array,
})

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("Credential", userSchema);
const UserInfo = new mongoose.model("Information", userInfoSchema);
const Recipe = new mongoose.model("Recipe", recipeSchema);
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});


app.get("/", function (req, res) {
   console.log(req);
    if (req.isAuthenticated()) {
       console.log("Already logged in");
        res.status(200);
        res.send("Already logged in");
    } else {
       console.log("Not logged in");
        res.status(502);
        res.send("not logged in");

    }
});

app.post("/getProfile", function (req, res) {
    const userName = req.body.username;
   console.log(userName);
    try {
        User.findOne({ username: userName }, function (err, userid) {
            if (err) {
                res.status(404);
                res.send("User not found");
            } else {
               console.log(userid);
                UserInfo.findOne({ 'username': userName }, function (err, foundUser) {
                    if (err) {
                       console.log(err);

                    } else {
                        if (foundUser == null) {
                            const emptyUser = {
                                fname: "",
                                lname: "",
                                username: userName,
                                address1: "",
                                address2: "",
                                postalcode: "",
                                mobile: "",
                                country: "",
                                state: ""
                            }
                            res.status(200);
                            res.send(emptyUser);
                        } else {
                            res.status(200);
                            res.send(foundUser);
                        }
                    }
                })
            }
        })
    } catch (error) {
       console.log(error);
    }
})


app.post("/logout", function (req, res) {
    try {
        req.logout();
        res.status(200);
       console.log("logged out");
        res.send("successfully logged out");
    } catch (error) {
        res.status(502);
        res.send(error)
    }
})


app.post("/profile", function (req, res) {
    try {
        const userDetail = req.body;
       console.log(userDetail);
        const newUser = new UserInfo({
            fname: userDetail.fname,
            lname: userDetail.lname,
            username: userDetail.username,
            address1: userDetail.address1,
            address2: userDetail.address2,
            postalcode: userDetail.postalcode,
            mobile: userDetail.mobile,
            country: userDetail.country,
            state: userDetail.state
        });
        UserInfo.findOne({ username: userDetail.username }, function (err, foundUser) {
            if (err) {
               console.log(err);
                res.status(502);
            } else {
                if (foundUser == null) {
                    res.status(200);
                    newUser.save(function (err) {
                        if (err) {
                           console.log(err);
                            res.status(502);
                        } else {
                            res.status(200);
                           console.log("Success");
                        }

                    });
                } else {
                    UserInfo.deleteOne({ username: foundUser.username }, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Suces");
                        }
                    });
                    newUser.save();
                    res.status(200);
                    res.send("Success");
                    console.log("sucess");
                }
            }
        })

    } catch (error) {
        res.status(502);
        res.send(error);
    }
})


app.post("/login", function (req, res) {
    console.log(req.body);
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    console.log(req.body);
    console.log(user);
    req.login(user, function (err) {
        if (err) {
            res.status(502);
            res.send(err);
        } else {
            let a = 0;
            passport.authenticate("local")(req, res, function () {
                a = 1;
                console.log("Successfully logged in");
                res.send(JSON.stringify({ "status": 200, "error": null }));
            })
            console.log(a);
        }
    })
});


app.post("/signup", function (req, res) {
    console.log(req.body);


    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.status(502);
            res.send(err);
        } else {
            let a = 0;
            passport.authenticate("local")(req, res, function () {
                a = 1;
                console.log("Successfully logged in");
                res.send(JSON.stringify({ "status": 200, "error": null }));
            })
            console.log(a);
        }
    })
});


app.post("/explore", function (req, res) {
    console.log(req.body);
    const index = req.body.index;
    const type = req.body.type;
    const difficulty = req.body.difficulty;
    const time = req.body.time;
    const name = req.body.name;
    const emptyList = [];
    const toskip = index>0? (index-1)*8: 0;
    var query = Recipe.find({
        type: (type === 'NA' ? { $nin: emptyList } : type),
        difficulty: (difficulty === 'NA' ? { $nin: emptyList } : difficulty),
        time: time === 'NA' ? { $nin: emptyList } : time,
        name: name == 'NA' ? { $nin: emptyList } : { $regex: name, "$options" : "i"}
    }, { directions: 0, url: 0, uniqueIngredients: 0, ingredients: 0, __v: 0 }).skip(toskip).limit(8);
    query.exec(function (err, result) {
        if (err) {
            res.status(502);
            res.send("error");
        } else {
            res.status(200);
            res.send(result);
        }
    })
});

app.post("/getPageCount", function(req, res){
    
    const model = req.body;
    const name=req.body.name;
    Recipe.find({...model, name:{$regex: name, "$options" : "i"}}, {_id:1, name:1}, function(err, found){
        if(!err){
            res.status(200);
            res.send(found);
        }else{
            res.status(502);
            res.send('error');
        }
    })
})

const ingredientsSchema = {
    names: Array
}

const Ingredients = new mongoose.model('Ingredient', ingredientsSchema);

app.post("/getIngredients", function(req, res){
    const names = req.body.names;
    console.log(names);
    Ingredients.find({names: {$regex: names, $options: "i"}}, function(err, found){
        if(err){
            res.status(502);
            res.send('error');
        }else{
            res.status(200);
            console.log(found);
            res.send(found);
        }
    })
})

app.post("/getRecipe", function(req, res){
    const ingredients = req.body.ingredients;
    console.log(ingredients);
    let finalData = [];
    Recipe.find({},{name:1,url:1, uniqueIngredients:1, id:1,likes:1, comments:1, type:1, difficulty:1, time:1 }, function(err, found){
        if(err){
            res.status(502);
            res.send(err);
        }else{
            found.forEach(recipe=>{
                const recipeIngredients = recipe.uniqueIngredients;
                let totalMatch = 0;
                let totalmismatch = 0;
                recipeIngredients.forEach(ingredient=>{
                    if(ingredients.includes(ingredient)){
                        totalMatch++;
                    }else{
                        totalmismatch++;
                    }
                })
                const percentage = (totalMatch/(totalMatch + totalmismatch))*100;
                console.log(percentage);
                const data_to_send = {
                    name: recipe.name,
                    difficulty: recipe.difficulty,
                    likes: recipe.likes,
                    comments: recipe.comments,
                    type: recipe.type,
                    uniqueIngredients: recipe.uniqueIngredients,
                    percentage: percentage,
                    id: recipe.id,
                    time: recipe.time
                }
                finalData.push(data_to_send);
            });
            finalData.sort(function(a, b){
                return a.percentage>b.percentage?1:-1;
            })
            const ret = finalData.filter(element => element.percentage>50);
            res.status(200);
            res.send(ret);
        }
    })
})


app.post("/getBlog", function(req, res){
    const id = req.body.id;
    Recipe.findOne({id: id}, function(err, found){
        if(err){
            res.status(502);
            res.send('error');
        }else{
            res.status(200);
            res.send(found);
        }
    })
})


app.post("/favourite", function(req, res){
    const id=req.body.id;
    const username=req.body.username;
    Recipe.findOne({id: id}, function(err, found){
        if(err){
            console.log(err);
        }else{
            found.usersLiked.push(username);
            console.log(found);
        }
    })
    UserInfo.findOne({username: username}, function(error, found){
        if(error){
            res.status(502);
            res.send('error');
        }else{
            res.status(200);
            found.favourites.push(id);
            found.save();
            console.log(found);
            res.send('success');

        }
    })
});

app.post("/myrecipe", function(req, res){
    const username= req.body.username;
    const id=req.body.id;
    UserInfo.findOne({username: username}, function(error, found){
        if(error){
            res.status(502);
            res.send('error');
        }else{
            res.status(200);
            found.myRecipe.push(id);
            found.save();
            console.log(found);
            res.send('success');

        }
    })
})

app.post("/getfavourites", function(req, res){
    const username = req.body.username;
    UserInfo.findOne({username:username}, {favourites:1}, function(err, found){
        if(err){
            res.status(502);
            res.send('error');
        }
        else{
            Recipe.find({id: {$in: found.favourites}}, {id:1, name:1, likes:1, comments:1, difficulty:1, type:1, time:1}, function(err, foundR){
                if(err){
                res.status(502);
                res.send('error');
                }else{
                    res.status(200);
                    res.send(foundR)
                }
            } )
        }
    })
});
app.post("/getmyrecipe", function(req, res){
    const username = req.body.username;
    UserInfo.findOne({username:username}, {myRecipe:1}, function(err, found){
        if(err){
            res.status(200);
            res.send('error');
        }
        else{
            Recipe.find({id: {$in: found.myRecipe}}, {id:1, name:1, likes:1, comments:1, difficulty:1, type:1, time:1}, function(err, foundR){
                if(err){
                res.status(502);
                res.send('error');
                }else{
                    res.status(200);
                    res.send(foundR)
                }
            } )
        }
    })
})

app.listen(4000, function () {
    console.log("Server started at port 4000");
})

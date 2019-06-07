//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {
  useNewUrlParser: true
});
//.................................................

//Mongoose Schema-itemsSchema
const itemsSchema = {
  name: String
};

//Mongoose Model-Item
const Item = mongoose.model('Item', itemsSchema);

//Mongoose individual documents - in the 'Item' model
const item1 = new Item({
  name: 'Hello, What are your main projects for today?'
});

const item2 = new Item({
  name: 'Press + to add a new Item'
});

const item3 = new Item({
  name: '<-- Use this to delete an item.'
});

const defaultItems = [item1, item2, item3];

//...................................................


// add the above mongoose DB items to the Todo list home page. Item is the Model (family) all the documents(list items are in)
app.get("/", function (req, res) {


  Item.find({}, function(err, foundItems){

if (foundItems.length === 0){
Item.insertMany(defaultItems, function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('Array added successfully to DB');
  }
});
res.redirect('/');  // the redirect here means you run the loop twice, adding the items the first time and rendering them the second. the if stops them repeating.
} else {

    res.render("list", {
      listTitle: 'Today',
      newListItems: foundItems  
    });
    };
    
  });

});

// This is where we actually post all this data we just got from the db to the web app itself and 
app.post("/", function (req, res) {

  const itemName = req.body.newItem;

  const item = new Item({
    name: itemName
  });

  item.save(); //SAVE NEW USER ITEMS TO DB, THEN REDIRECT TO / WHERE WE SEARCH DB WITH ITEM.FIND AND RETURN IT TO THE USER AS A NEW NOTE

  res.redirect('/');
  
});

app.get("/work", function (req, res) {
  res.render("list", {
    listTitle: "Work List",
    newListItems: workItems
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});


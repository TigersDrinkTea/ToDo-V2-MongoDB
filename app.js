//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://admin-cogs:cogsShard19@cluster0-uwrq7.mongodb.net/todolistDB', {
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
  name: 'Press + to add a new item'
});

const item3 = new Item({
  name: 'Use check box to delete an item.'
});

const defaultItems = [item1, item2, item3];
//..................................................

// we design the list schema for the various pages, eg work list etc, but the items themsleves are going to be an array of the origional schema, just the same
const listSchema = {
  name: String,
  items: [itemsSchema]
};
// Mongoose List model from mongoose List schema 
const List = mongoose.model('List', listSchema);

//we create the docuemnts dynamically further below in the app.get/:customListName


//...................................................


// add the above mongoose DB items to the Todo list home page. Item is the Model (family) all the documents(list items are in)
app.get("/", function (req, res) {


  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Array added successfully to DB');
        }
      });
      res.redirect('/'); // the redirect here means you run the loop twice, adding the items the first time and rendering them the second. the if stops them repeating.
    } else {

      res.render("list", {
        listTitle: 'Today',
        newListItems: foundItems
      });
    };

  });

});


// using express route parameters to dynamically create the routes we need to new pages, whatever they type in the url this creates a dedicated /route (page)
app.get('/:customListName', function (req, res) {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({ // telling the newly titled page that it will contain the same starting array.
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect('/' + customListName); // this allows us to run through the if loop again and stops producing the same data again 
      } else {
        //show the existing list
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      }
    }
  });
});




// This is where we actually post all this data we just got from the db to the web app itself and 
app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  //HOME LIST: SAVE NEW USER ITEMS TO DB, THEN REDIRECT TO / WHERE WE SEARCH DB WITH ITEM.FIND AND RETURN IT TO THE USER AS A NEW NOTE, SIMPLE FOR THE TODAY LIST ON HOME ROUTE
  if (listName ===  'Today') {
    item.save();     
    res.redirect('/');
  } else { // CUSTOM LIST: WE FIND THE CUSTOM LIST THEN ADD THE ITEM TO THAT CUSTOM LIST AND REDIRECT ABCK TO THE CUSTOM LIST WHERE IT IS RENDERED BACK 
    List.findOne({name:listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName); // REDIRECT: THIS TAKES US UP TO APP.GET:/CUSTOMLISTNAME AND FROM THERE WE GO THROUGH THE IF TO SEE IF ITS BRAND NEW AND RENDER THE DEFAULTS OR IF THE LIST ALLREADY EXISTS RENDER IT WITH THE FOUND ITEMS
    })

  }
  
});

// DELETE BUTTON...............................................
//we post the delete
app.post('/delete', function (req, res) {

  const checkedItemId = req.body.checkBox; // get the id of the info from the check box so you know what to delete, using ejs <%= %> in list.ejs
  const listName = req.body.listName;

  if (listName === 'Today') {

// use this function to use the hidden input listName to determine if you are deleting from a custom or home list and redirect as appropriate
    Item.findByIdAndRemove(checkedItemId, function (err) { //actually find the item and remove it
      if (err) {
        console.log(err);
  
      } else {
        console.log('Successfully deleted');
        res.redirect('/'); // redirect to / route updates the page to show all docs listed in DB as thats what we made the / route do !
      }
    });
  }else {
    
    List.findOneAndUpdate({name:listName}, {$pull: {items:{_id:checkedItemId}}}, function(err,foundList){
if (!err){
  res.redirect('/' + listName);
}
    });
  }
});




app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on port 3000");
});
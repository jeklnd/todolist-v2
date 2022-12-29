// import modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// initialize modules
const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// connect to database
mongoose.set("strictQuery", true);
mongoose.connect("mongodb://localhost:27017/todolistDB");

// define collections
const Item = new mongoose.model("Item", itemsSchema = new mongoose.Schema({ 
  name: String 
}));

const defaultItem1 = new Item({ name: "Welcome to your to do list!" });
const defaultItem2 = new Item({ name: "Press + to add a new item" });
const defaultItem3 = new Item({ name: "<-- Check the box to delete an item" });
const defaultItems = [defaultItem1, defaultItem2, defaultItem3];

const List = new mongoose.model("List", new mongoose.Schema({
  name: String,
  items: [itemsSchema],
}));

// routes
app.get("/", (req, res) => {
  Item.find((err, result) => {
    if (result.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Default items inserted");
          Item.find((err, result) => {
            if (err) {
              console.log(err);
            } else {
              res.render("list", { listTitle: "Today", newListItems: result });
            }
          });
        }
      });
    } else {
      res.render("list", { listTitle: "Today", newListItems: result });
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({ name: itemName });

  if (listName === "Today") {
    newItem.save();
    console.log(`Added new item to the items collection: '${itemName}'`);
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, result) => {
      result.items.push(newItem);
      result.save();
      console.log(`Added new item to the ${listName} collection: '${itemName}'`);
      res.redirect(`/${listName}`);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  const itemName = req.body.newItem;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Item deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          console.log(`Item deleted`);
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  // console.log(customListName);

  List.findOne({ name: customListName }, (err, result) => {
    if (err) {
      console.log(err);
    } else if (result === null) {
      console.log(
        `\nA list named ${customListName} does not exist, creating list...`
      );
      const list = new List({
        name: customListName,
        items: defaultItems,
      });

      list.save();
      console.log(`Created a new list called ${customListName}.\n`);
      res.redirect(`/${customListName}`);
    } else {
      res.render("list", {
        listTitle: customListName,
        newListItems: result.items,
      });
    }
  });
});

app.listen(3000, () => {
  console.log("Server started on port 3000\n");
});

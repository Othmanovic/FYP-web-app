const e = require("express");
const express = require("express");
const passport = require("passport");
const router = express.Router();
const SHOP = require('../models/Shop')

router.get("/google", passport.authenticate("google", { scope: ["profile","email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/chooseUser" }),
  async (req, res) => {
    console.log('user is', req.user)
    if (req.user.type== null){
      res.redirect("/chooseUser")
    }
    else if (req.user.type == "shopOwner") {
      if (req.user.verified) {
        res.redirect("/" + req.user.type + "/dashboard");
      } else {
        res.render("shopWaiting");
      }

    } else {

      res.redirect("/" + req.user.type + "/dashboard");
    }
  }
);

router.get("/logout", (req, res) => {
  req.logOut()
  res.redirect('/')
});

module.exports = router;

var GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const USER = require("../models/User");
const SHOPOWNER = require("../models/Shop");
const CUSTOMER = require("../models/Customer");

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // console.log("The profile contains:", profile.emails[0].value);
          let user = await USER.findOne({ googleId: profile.id}).lean()
          // console.log(user);
          // registered user
          if (user) {
           
            done(null, user)

          } 
          else {
            // non registered user
            
            const newUser = { googleId: profile.id, username: profile.displayName, email: profile.emails[0].value}
            const addedUser = await USER.create(newUser);
       

            done(null, addedUser)
          }


        } catch (error) {
          console.log(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log('serializeUser', user);
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    // console.log('deserializeUser', user);
    const user = await USER.findById(id).lean()
    done(null, user);
  }
  );
};

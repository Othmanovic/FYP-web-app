const express = require('express')
const router = express.Router()
const {ensureAuth , ensureGuest} = require('../middleware/auth')
// const Story = require('../models/Story')
const Orders = require('../models/Order')
const Customer = require('../models/Customer')



router.get('/',(req,res)=>{
     res.render("login",{
          layout: false
     })
})


// router.use(express.static('views' + '/public'));

// router.get('/',(req,res)=>{
//      res.send('Google Sign in');
// })
router.get('/dashboard',ensureAuth,async (req,res)=>{
          res.render("dashboard",{
               user: req.user,
               layout: false
          })
     
})


module.exports = router
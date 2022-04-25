const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const passport = require("passport");
const methodOverride = require('method-override')
const morgan = require("morgan");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const connectDB = require("./config/db");
const exphbs = require("express-handlebars");
const PRODUCT = require('./models/Product')
const ORDER = require('./models/Order')
const SHOP = require('./models/Shop')
const USER = require('./models/User')
const CUSTOMER = require('./models/Customer')
const nodemailer = require('nodemailer');
const multer = require('multer');
const http = require('http');
const jsreport = require('jsreport');
const pdfDocument = require('pdfkit');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;



//load config
dotenv.config({ path: "./config/config.env" });

const app = express();
// images configs and routes


//multer options

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images')
  },
  filename: function (req, file, cb) {
    console.log(file);

    cb(null, Date.now() + file.originalname)
  }
})

var upload = multer({
  storage: storage,

  fileFilter: (req,file , cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }

});



var storageFile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/files')
  },
  filename: function (req, file, cb) {
    console.log("file name is :", file);

    cb(null, Date.now() + file.originalname)
  }
})

var uploadFile = multer({
  storage: storageFile,

  fileFilter: (req, file, cb) => {
    if ( file.mimetype == "application/pdf" || file.mimetype == "application/msword" || file.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
    || file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .pdf, .docx and .ppt format allowed!'));
    }
  }
});


// const uploadFile = multer({ dest: "public/files" });

// //API Endpoint for uploading file
// app.post("/api/uploadFile", upload.single("myFile"),(req, res) => {
//   console.log("File data here", req.file);

// });



///////////////////////////////////////////////////////////////////////////


//stripe config
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const stripe = require('stripe')(stripeSecretKey);
const cust_id = 'cus_JUUF5OH9cuHn68'

//passport config
require("./config/passport")(passport);

// load routes
const main = require("./routes/index");
const auth = require("./routes/auth");
// const stories = require("./routes/stories");

// body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Method override
// app.use(
//   methodOverride(function (req, res) {
//     if (req.body && typeof req.body === 'object' && '_method' in req.body) {
//       // look in urlencoded POST bodies and delete it
//       let method = req.body._method
//       delete req.body._method
//       return method
//     }
//   })
// )

const port = process.env.PORT || 3000;

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// helpers
const {
  ifEquals,
  formatDate,
  stripTags,
  truncate,
  editIcon,
  select,
} = require('./helpers/hbs');
const nodemon = require("nodemon");
const { token } = require("morgan");
const Product = require("./models/Product");
const Shop = require("./models/Shop");
const Order = require("./models/Order");
const { ensureAuth, ensureNoType } = require("./middleware/auth");
const { findById } = require("./models/Product");

//view engine
app.engine(
  "hbs",
  exphbs({
    helpers: { ifEquals, formatDate, stripTags, truncate, editIcon, select },
    defaultLayout: false,
    extname: "hbs",
  })
);
app.set("view engine", "hbs");

//sessions
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
  })
);

//passport middlware
app.use(passport.initialize());
app.use(passport.session());

// Set global var
app.use(function (req, res, next) {
  res.locals.user = req.user || null
  next()
})

//nodemailer setup
// Step 1
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL || 'utmonlineprintingsystem@gmail.com',
    // user: 'alessandroleonel24@gmail.com', 
    pass: process.env.PASSWORD || 'hggih;fv1000lvi'
    // pass: 'abCd1234*' 
  }
});

//static folder
app.use(express.static(path.join(__dirname, "public")));

//systemAdmin
app.get('/systemAdmin/dashboard', async (req, res) => {

  try {
    var users = await USER.find({ verified: false, type: "shopOwner" }).lean()


    res.render('systemAdmin/dashboard', { layout: "mainAdmin", users })

  } catch (error) {
    console.error('Error is Bla Bla:', error);
    res.render("error");
  }

});


//accept shop registration
app.get('/acceptShop/:id', async (req, res) => {

  try {
    await USER.findByIdAndUpdate(req.params.id, { verified: true })

    res.redirect('/systemAdmin/dashboard')

  } catch (error) {
    console.error('Error is Bla Bla:', error);
    res.render("error");
  }
});


app.get('/chooseUser', ensureNoType, async (req, res) => {

  try {
    res.render('chooseUser', {})

  } catch (error) {
    console.error('Error is Bla Bla:', error);
    res.render("error");
  }
});


app.get('/submitChoice/:type', ensureNoType, async (req, res) => {
  const { type } = req.params;
  console.log("USER TYPE IS: ", type);
  try {
   await USER.findByIdAndUpdate(req.user._id, { type: type })
    if (type == "shopOwner") {
      const shopOwner = {
        shopName: req.user.username,
        user: req.user._id,
        shopEmail: req.user.email,
        shopImage: "",
      }
      await SHOP.create(shopOwner);
    }
    else if (type == "customer") {
      const customerInfo = {
        displayName: req.user.username,
        image: "",
        user: req.user._id,
        email: req.user.email,
        phoneNo: "",
        matricNo: "",
        icNo: "",
      }
      await CUSTOMER.create(customerInfo);

    }
    if (type == "shopOwner") {
      if (req.user.verified) {
        res.redirect("/" + type + "/dashboard");
      } else {
        res.render("shopWaiting");
      }

    } else {

      res.redirect("/" + type + "/dashboard");
    }

  } catch (error) {
    console.error('Error is Bla Bla:', error);
    res.render("error", { title: error, message: error._message });
  }
});



//customer dashboard
app.get('/customer/dashboard', async (req, res) => {

  try {
    var shops = await SHOP.find().lean()

    for (let i = 0; i < shops.length; i++) {
      const allOrders = await ORDER.find({ shopOwner: shops[i]._id, status: 'accepted' }).lean()
      shops[i].shopQueue = allOrders.length;
    }

    res.render('customer/dashboard', { layout: "mainCust", shops: shops })

  } catch (error) {
    console.error(error);
    res.render("customer/error", { title: error, message: error._message });
  }
})

app.get('/customer/shopForCust/:id', async (req, res) => {

  try {
    const shop = await SHOP.findById(req.params.id).lean()
    const products = await PRODUCT.find({ shopOwner: req.params.id }).lean()
    // console.log("shop products");
    res.render('customer/shopForCust', { products, shop })

  } catch (error) {
    console.error(error);
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
  }
})

// customer orders
app.get('/customer/orders', async (req, res) => {
  try {
    const customer = await CUSTOMER.findOne({ user: req.user._id }).lean()
    const orders = await ORDER.find({ customer: customer._id }).lean().populate('product').populate("shopOwner")
    // res.send("O/rders")
    res.render('customer/orders', { layout: "mainCust", orders })
  } catch (error) {
    console.error(error);
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
  }
})

// shopOwner dashboard
app.get('/shopOwner/dashboard', async (req, res) => {
  // console.log(req.session.user);
  var acceptedOrders = []
  var upcomingOrders = []

  try {
    const shop = await SHOP.findOne({ user: req.user._id }).lean()
    const orders = await ORDER.find({ shopOwner: shop._id }).lean().populate('product')

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      if (order.status == 'pending') {
        upcomingOrders.push(order)
      }
      if (order.status == 'accepted') {
        acceptedOrders.push(order)
      }
    }
    res.render('shopOwner/dashboard', { layout: "mainShopOwner", shop: shop, acceptedOrders: acceptedOrders, upcomingOrders: upcomingOrders })

  } catch (error) {
    console.error('Error is Bla Bla:', error);
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
  }
});


app.get('/shopOwner/dashboard', (req, res) => {
  res.render('shopOwner/dashboard', { layout: "mainShopOwner" })
})


// accept order route
app.get('/acceptOrder/:id', async (req, res) => {
  const { id } = req.params
  try {
    await ORDER.findByIdAndUpdate(id, { status: 'accepted' })
    const order = await ORDER.findById(id).lean().populate("customer").populate("product").populate("shopOwner")
    // console.log("ORDER DETAILS", order);


    // setup email data with unicode symbols
    let mailOptions = {
      from: '"UTM-OPS" <othman.elhammali@gmail.com>', // sender address
      to: order.customer.email, // list of receivers
      subject: 'Order Acceptance', // Subject line
      text: `Hello Mr ${order.customer.displayName} your ${order.product.productName} printing order from the shop ${order.shopOwner.shopName} has been accepted by the shop admin, you will be notified once the order is ready.\n\n Thank you for shopping with UTM-OPS.`, // plain text body
      //html: output // html body
    };

    // send mail with defined transport object
    let emailSent = await transporter.sendMail(mailOptions);
    res.render('shopOwner/notificationSent', {order})


  } catch (error) {
    console.error(error);
    res.render("shopOwner/error", { title: error, message: error._message });
  }
});

// complete order route
app.get('/completeOrder/:id', async (req, res) => {
  const { id } = req.params
  try {
     await ORDER.findByIdAndUpdate(id, { status: 'completed' })
    const order = await ORDER.findById(id).lean().populate("customer").populate("product").populate("shopOwner")

    let mailOptions = {
      from: '"UTM-OPS" <othman.elhammali@gmail.com>', // sender address
      to: order.customer.email, // list of receivers
      subject: 'Order Completion', // Subject line
      text: `Hello Mr ${order.customer.displayName} your ${order.product.productName} printing order from the shop ${order.shopOwner.shopName} has been completed.\n You may pick it up from the shop.\n\n Thank you for shopping with UTM-OPS.`, // plain text body
      //html: output // html body
    };

    // send mail with defined transport object
    let emailSent = await transporter.sendMail(mailOptions)
    res.render('shopOwner/notificationSent', {order})


  } catch (error) {
    console.error(error);
    res.render("shopOwner/error", { title: error, message: error._message });
  }
});

// reject order route
app.get('/rejectOrder/:id', async (req, res) => {
  const { id } = req.params
  try {
     await ORDER.findByIdAndUpdate(id, { status: 'rejected' })
     const order = await ORDER.findById(id).lean().populate("customer").populate("product").populate("shopOwner")

    let mailOptions = {
      from: '"UTM-OPS" <othman.elhammali@gmail.com>', // sender address
      to: order.customer.email, // list of receivers
      subject: 'Order Rejection', // Subject line
      text: `Hello Mr ${order.customer.displayName}. Unfortunately, your ${order.product.productName} printing order from the shop ${order.shopOwner.shopName} has been Rejected by the shop admin.\nFor further inqueries, please contact ${order.shopOwner.email}.\n\n Thank you for shopping with UTM-OPS.`, // plain text body
      //html: output // html body
    };

    // send mail with defined transport object
    let emailSent = await transporter.sendMail(mailOptions)
    let status = req.params.status;
    res.render('shopOwner/notificationSent', {order})


  } catch (error) {
    console.error(error);
    res.render("shopOwner/error", { title: error, message: error._message });

  }
});

//checkout page route
app.get('/checkout/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await PRODUCT.findById(id).lean();
    res.render('customer/checkout', { layout: false, product: product })

  } catch (error) {
    console.error(error);
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
  }
});

//upload printing file
// app.post("/uploadFile",ensureAuth, uploadFile.single("document"), async (req, res, next) => {
//   const file = req.file
//  if (!file) {
//     const error = new Error('Please upload a file')
//     error.httpStatusCode = 400
//     return next(error)
//   }    
// });


// checkout purchase
app.post('/buy', uploadFile.single("document"), async (req, res) => {
  const { productId, numPages, matricNo, quantity, token } = req.body;
  var filename = req.file.filename;
  try {
    const product = await PRODUCT.findById(productId).lean().populate('shopOwner').populate('customer')

    const orderData = { filename, numPages, matricNo, quantity }
    let customer = await CUSTOMER.findOne({ user: req.user._id });
    orderData.customer = customer._id;
    orderData.product = product._id;
    orderData.shopOwner = product.shopOwner._id;
    orderData.totalPrice = parseFloat(product.productPrice) * parseFloat(numPages) * parseFloat(quantity);
    let orderCreated = await ORDER.create(orderData);


    // `source` is obtained with Stripe.js; see https://stripe.com/docs/payments/accept-a-payment-charges#web-create-token
    const charge = await stripe.charges.create({
      amount: parseInt(orderData.totalPrice) * 100,
      currency: 'myr',
      source: token,
      description: `payment for ${product.productName} of  ${numPages} has been done successfully`,

    });
    // console.log("charge");
    console.log(charge.status);
    // console.log(charge);
    if (charge.status == "succeeded") {
      return  res.json({ status: 200, orderId: orderCreated._id })
    } else {
      return res.json({ status: 400 })
    }

  } catch (error) {
    console.error(error);
    return  res.render("cutomer/error", { title: error, message: error._message });
  }
})

app.get('/customer/paymentSuccess/:id', async (req, res) => {

  try {
    const order = await ORDER.findById(req.params.id).lean().populate('customer').populate('shopOwner').populate('product')
    res.render('customer/paymentSuccess', {order})
  } catch (error) {
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
  }
});


//customer profile
app.get('/customer/profile', async (req, res) => {

  try {
    const customer = await CUSTOMER.findOne({ user: req.user._id }).lean()
    res.render('customer/profile', { layout: "mainCust", customer })
    // console.log("customer info", customer);
  } catch (error) {
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      console.log("ERROR OBJECT", error)
      res.render("customer/error", { title: error, message: error._message });
    }
  }
});

app.get('/customer/editProfile', async (req, res) => {

  try {
    const customer = await CUSTOMER.findOne({ user: req.user._id }).lean()
    res.render('customer/editProfile', { layout: "mainCust", customer })

  } catch (error) {
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
  }
});

app.post('/editProfile', async (req, res) => {
  
  try {
    const customer = await CUSTOMER.findOne({ user: req.user._id }).lean()
    const { phoneNo, matricNo, icNo } = req.body;
    var updatedCust = await CUSTOMER.findByIdAndUpdate(customer._id, { phoneNo: phoneNo, matricNo: matricNo, icNo: icNo });
    console.log("new profile", req.body);
    res.redirect('customer/profile')
  } catch (error) {
    console.log("edit profile error", error);
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
    // res.render(req.user.type + '/error')
  }
});




//Create product
app.post('/add', upload.single('productImage'), async (req, res) => {

  try {
    // console.log(req.body)
    // console.log(req.file)
    const { productName, productPrice } = req.body;
    const newProduct = { productName, productPrice }
    newProduct.productImage = req.file.filename;
    const shop = await SHOP.findOne({ user: req.user._id }).lean()
    newProduct.shopOwner = shop._id;
    var addedProduct = await PRODUCT.create(newProduct);
    res.redirect('/shopOwner/shopProducts')

  } catch (error) {
    console.log("ERROR IS ",error._message)
    res.render("shopOwner/error", { title: error, message: error._message });
    
  }
});

//edit shop name
app.get('/shopOwner/editShop', async (req, res) => {
  try {
    const shop = await SHOP.findOne({ user: req.user._id }).lean()

    res.render('shopOwner/editShop', { layout: "mainShopOwner", shop })
  } catch (error) {
    console.error(error);
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
  }
});

//edit shop image
app.get('/shopOwner/editImage', async (req, res) => {
  try {
    const shop = await SHOP.findOne({ user: req.user._id }).lean()

    res.render('shopOwner/editImage', { layout: "mainShopOwner", shop })
  } catch (error) {
    console.error(error);
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
  }
});

//edit shop name
app.post('/editShop', async (req, res) => {

  try {
    const shop = await SHOP.findOne({ user: req.user._id }).lean()
    const newName = req.body.shopName
    console.log("updated shop", shop);
    // const newImage = req.file.filename;
    await SHOP.findByIdAndUpdate(shop._id, { shopName: newName })

    res.redirect('/shopOwner/shopProducts')

  } catch (error) {
    console.log(error)
    res.json(error)
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
  }
});

//edit shop image
app.post('/editImage', upload.single('shopImage'), async (req, res) => {

  try {

    const newImage = req.file.filename;
    const shop = await SHOP.findOne({ user: req.user._id }).lean()
    await SHOP.findByIdAndUpdate(shop._id, { shopImage: newImage })

    console.log("updated shop", shop);
    res.redirect('/shopOwner/shopProducts')

  } catch (error) {
    console.log(error)
    res.json(error)
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
  }
});

//routes
app.use("/", main);
app.use("/auth", auth);

//shop products service page
app.get('/shopOwner/shopProducts', async (req, res) => {
  // console.log(req.user);
  try {
    const shop = await SHOP.findOne({ user: req.user._id }).lean()
    const products = await PRODUCT.find({ shopOwner: shop._id }).lean().populate('shopOwner');
    // res.json(products)
    // console.log(products);
    res.render('shopOwner/shopProducts', { layout: "mainShopOwner", products, shop })
  } catch (error) {
    console.error(error);
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
  }

});


//add product
app.get('/shopOwner/addProduct', (req, res) => {
  res.render('shopOwner/addProduct', { layout: "mainShopOwner" })
})

//manage shop status
app.get('/shopOwner/statusToggle', async (req, res) => {
  const shop = await SHOP.findOne({ user: req.user._id }).lean()
  console.log("shop status", shop.status);
  var updatedStatus = ''
  if (shop.status == 'available') {
    updatedStatus = 'closed'
  } else {
    updatedStatus = 'available'
  }

  var result = await SHOP.findByIdAndUpdate(shop._id, { status: updatedStatus });
  console.log("result is: ", result);
  res.json({ status: true })

})


//manage products
app.get('/shopOwner/editProduct/:id', async (req, res) => {

  try {
    const product = await PRODUCT.findById(req.params.id).lean()
    if (!product) {
      return res.render('error/404')
    }

    if (product.user != req.user.id) {
      res.send('This product does not exist')
    } else {
      res.render('shopOwner/editProduct', { layout: "mainShopOwner", product })
    }

  } catch (error) {
    console.error(error)
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
    
      res.render(req.user.type + "/error", { title: error, message: error._message });
    
    }

  }
});

// Delete product

app.get("/shopOwner/deleteProduct/:id", async (req, res) => {
  try {
    await PRODUCT.findByIdAndDelete(req.params.id)
    res.redirect('/shopOwner/shopProducts')
  } catch (error) {
    console.log("The error is: ", error);
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
  }

})


// http.createServer((req, res) => {
//   jsreport.render({
//     template: {
//       content: '<h1>Hello world</h1>',
//       engine: 'handlebars',
//       recipe: 'chrone-pdf'
//     }
//   }).then((out)  => {
//     out.stream.pipe(res);
//   }).catch((e) => {
//     res.end(e.message);
//   });

// }).listen(1337, '127.0.0.1');


app.get('/shopOwner/generateReport', ensureAuth, async (req, res) => {

  try {
    const shop = await SHOP.findOne({ user: req.user._id }).lean()
    const orders = await ORDER.find({ shopOwner: shop._id }).lean().populate('product').populate("shopOwner")
    console.log("in Generate report", orders)
    res.render('shopOwner/report', { layout: false, orders })


  } catch (error) {
    if (req.user.type ==null) {
      res.render("/error", { title: error, message: error._message });
    }
    else {
      res.render(req.user.type + "/error", { title: error, message: error._message });
    }
    console.log("in Generate Report Error", error)

  }

});


connectDB();

app.listen(
  port,
  console.log(
    `server running in ${process.env.NODE_ENV} mode,  on port ${port}`
  )
);



app.post('/mail', async (req, res) => {
  console.log(req.body);
  // const email= req.body.email
  // const message= req.body.message
  const { email, message } = req.body;
  // Step 2
  let mailOptions = {
    from: 'utmonlineprintingsystem@gmail.com',
    to: 'alhammali1996@graduate.utm.my',
    subject: "Complain from " + email,
    text: message
  };

  transporter.sendMail(mailOptions, (err, data) => {
    if (err) {
      console.log('Error occurs', err);
      if (req.user.type ==null) {
        res.render("/error", { title: err, message: err.message });
      }
      else {
        res.render(req.user.type + "/error", { title: err, message: err.message });
      }


    }
    console.log('Email sent, Voilla!');
    res.redirect(req.user.type +'/emailSent')
  });
});


app.post('/mailToShop/:id', async (req, res) => {

  console.log("SDsadufhpkusfh",);
  

  const shop = await SHOP.findById(req.params.id).lean()
  console.log("SHOP EMAIL IS: ", shop.shopEmail);
  const { email, message } = req.body;
  let mailOptions = {
    from: 'utmonlineprintingsystem@gmail.com',
    to: shop.shopEmail,
    subject: "Complain from " + email,
    text: message
  };

  transporter.sendMail(mailOptions, (err, data) => {
    if (err) {
      console.log('Error occurs', err);
      res.render( "customer/error", { title: err, message: err.message });

    }
    console.log('Email sent, Voilla!');
    res.render('customer/emailSentToShop')
  });
});

//email sent
app.get('/customer/emailSent', async (req, res) => {
  try {
    res.render('customer/emailSent')
  } catch (error) {
    res.send(error)
  }

});

app.get('/shopOwner/emailSent', async (req, res) => {
  try {
    res.render('shopOwner/emailSent')
  } catch (error) {
    res.send(error)
  }
});



app.get('/test', async (req, res) => {
  const shop = await SHOP.findOne({ user: req.user._id }).lean()
  const orders = await ORDER.find({ shopOwner: shop._id, status: "accepted" }).lean()
  res.json(orders.length)


});

app.get('/about', async (req, res) => {
 
  try {
    res.render('about');
  } catch (error) {
    res.send(error)
  }
});


app.get('/terms', async (req, res) => {
 
  try {
    res.render('terms');
  } catch (error) {
    res.send(error)
  }
});


app.get('*', async (req, res) => {

   res.render( "error");
   return
    

});



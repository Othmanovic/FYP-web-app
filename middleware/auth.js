module.exports ={
    ensureAuth: function(req,res,next){
        if(req.isAuthenticated() ){
            return next()
        }else{
            res.redirect('/')
        }
    },
    ensureGuest: function(req,res,next){
        if(req.isAuthenticated()){
            res.redirect('/dashboard')
        }else{
            return next()
        }
    },
    ensureNoType: function(req,res,next){
        if( req.user.type == null){
            return next()
        }else{
            res.redirect('/')
        }
    }
}
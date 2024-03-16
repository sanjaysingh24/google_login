import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import ejs from 'ejs'
import bodyParser from 'body-parser';

import passport from 'passport';
import 'dotenv/config';
import passportgoogle from 'passport-google-oauth20';

// initialize the Strategy

const GoogleStrategy = passportgoogle.Strategy;
//intialize the port and the express

const app = express();
const port = process.env.PORT||4000;


//code for sessions
app.use(session({
    secret:'baba',
    resolve:false,
    saveUninitialized:true,
    cookie:{secure:false,maxAge:6000}
}))
// then intialize the passport

// this one is used to integrate the passport
app.use(passport.initialize());

// this one is used to use the session management
app.use(passport.session());

app.set('view engine', 'ejs');

// code for to connect the mongodb
main().catch((err)=>{
    console.log(err.message);
})


async function main(){
    await mongoose.connect(`${process.env.MONGODB}`);
    console.log("mongodb connected successfully");
}



// create a schema on mongodb which store the google id or name in the database
const userSchema = new mongoose.Schema({
    googleID:String,
    name:String
},{timestamps:true})


// here create a model
const User = mongoose.model('User',userSchema);

// for google login
passport.use(new GoogleStrategy({
    clientID:process.env.CLIENTID, // u can achive it from google console
    clientSecret:process.env.SECRET, // same 
    callbackURL:"https://google-login-0m4z.onrender.com/auth/google/callback"
},
async function (accessTOken,refreshToken,profile,done){
    try{
        const user = await User.findOne({googleId:profile.id}); //checking for the use id in database
        
        // if user is already store in database then  simply return the user  
        if(user){
            return done(null,user);
        }


        else{
            const newUSer = new User({
                googleID:profile.id,
                name:profile.displayName,
            });
            const doc = await newUSer.save();
            console.log(doc);
            return done(null,doc);

        }
    }
    catch(err){
        console.log(err.message);
    }
}


));

passport.serializeUser((user,done)=>{
    if(user){
        return done(null,user.id)
    }
    return done(null,false);
});

passport.deserializeUser((id,done)=>{
    const user = User.findById(id);
    if(user){
        return done(null,user);
    }
    return done(null,false);
})



app.get("/",(req,res)=>{
    res.render('index');

})
app.get('/content',isAuthenticate,(req,res)=>{
    res.render('content');
})


app.get('/logout',(req,res)=>{
    req.logout((err)=>{
        if(err){
            res.json(err);
        }
        else{
            res.redirect('/');
         
        }
    });
  
})
function isAuthenticate(req,res,done){
    if(req.user){
        return done();
    }
    else{
        return res.redirect("/");
    }
}


app.get('/auth/google',
passport.authenticate('google',{scope:['profile']}));

app.get('/auth/google/callback',
passport.authenticate('google',{failureRedirect:'/'}),
function(req,res){
    res.redirect('/content');
}
)






app.listen(port,()=>{
    console.log(`listening on ${port}`);
})

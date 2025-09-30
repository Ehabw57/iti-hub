const mongoose = require ("mongoose");
const User = require("../models/User");

async function getAllUsers (req , res){
    try{
        const users = await User.find();
        res.status(200).json(users);
    } 
    catch (err){
      res.status(500).json({massage:err.massage});
    }
}

async function getUserById(){
try{
  const user =await User.findById(res.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  }
   catch (err) {
    res.status(500).json({ message:err.message });
  }

}


module.exports={getAllUsers , getUserById 
  }

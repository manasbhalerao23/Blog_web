import bcrypt from "bcrypt"
import express from "express"
import {InvoiceModel, paymentModel, User} from "../models/db"
import jwt, { JwtPayload } from "jsonwebtoken"
import dotenv from "dotenv"
import {Request , Response, Router} from "express"
import { send } from "process"
import { AuthRequest, checkAdmin, userAuth, verifyAcessToken } from "../middlewares/auth"
import mongoose from "mongoose"
dotenv.config()

const authRouter= express.Router();
//Fix this type error later
//@ts-ignore  
authRouter.post("/reconnection", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: "You need to login again (error=RT12)" });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY as string) as JwtPayload;
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        return res.status(403).json({ error: "Refresh token expired. Please log in again." });
      }
      return res.status(403).json({ error: "Invalid refresh token." });
    }

    const _id = decoded._id;
    if (!_id) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    // Find user in the database
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Optionally: Check if refresh token is stored in DB before issuing a new one
    if (user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: "Refresh token is no longer valid. Please log in again." });
    }

    // Generate new refresh token
    const newRefreshToken = jwt.sign({ _id }, process.env.JWT_REFRESH_KEY as string, { expiresIn: "1d" });

    // ✅ Store the new refresh token in DB (or Redis)
    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Enable in production
      sameSite: "strict"
    });

    // Generate new access token
    const newAccessToken = jwt.sign({ _id: user._id }, process.env.JWT_KEY as string, { expiresIn: "30m" });

    const sendingUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      address: user.address,
      contact: user.contact,
      currentDonation: user.currentDonation,
      currentRent: user.currentRent,
      monthRent: user.monthRent,
      totalDonation: user.totalDonation,
      role: user.role,
      shopName: user.shopName,
      monthStatus: user.monthstatus
    };

    return res.json({ user: sendingUser, accessToken: newAccessToken });
  } catch (err) {
    console.error("Error in reconnection API:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});



authRouter.get("/getRents", async(req: Request, res: Response) => {
  try{
    const user_id = req.query.user_id;
    if(!user_id){
      res.status(400).json({msg:"Not found ID"})
      return 
    }
    const resp = await InvoiceModel.find({  userId: new mongoose.Types.ObjectId(user_id.toString())});
    console.log(user_id);
    console.log(resp);
    
    res.status(200).json({resp});
  }
  catch(e){
    console.log(e);
  }
});

authRouter.post("/login", async( req: Request, res: Response):Promise<void>=>{
  try{
    const {username, password} = req.body;
    
    
    const user = await User.findOne(
      {$or:[{username}, 
        {email:username}
      ]}
    );
    
    
    if(!user){
    
       res.status(400).json({ message: "User Not Found" });
       return;
    }
    const isValidPassword = await bcrypt.compare(password, user.password as string);
    if(!isValidPassword){
       res.status(400).json({ message: "Invalid credentials" });
       return;
      }

  const accessToken= jwt.sign({_id:user._id},process.env.JWT_KEY as string, {expiresIn:"30m"});
  const refreshToken= jwt.sign({_id:user._id},process.env.JWT_REFRESH_KEY as string, {expiresIn:"1d"});

  res.cookie("refreshToken",refreshToken,{
    httpOnly:true,
    // secure:true //after HTTPS certification,
    sameSite:"strict"
  })

  user.refreshToken = refreshToken;
  await user.save();

  
      const sendingUser={
        _id:user._id,
        username:user.username,
        email:user.email,
        address:user.address,
        contact:user.contact,
        currentDonation:user.currentDonation,
        currentRent:user.currentRent,
        monthRent:user.monthRent,
        totalDonation:user.totalDonation,
        role:user.role,
        shopName:user.shopName,
        monthStatus:user.monthstatus

      }
      res.json({ msg:sendingUser, token:accessToken });
      return;


    

  }catch(err){
    console.log(err)
    res.status(500).json({ error: "Internal Server Error" });


  }
})

authRouter.post("/getInfo",userAuth,async (req:AuthRequest, res:Response)=>{ // RENT invoice getter
  try{

    const {id, orderId}= req.body;
    if(!id){
      res.status(400).json({ error: "Id not found" });
      return;
    }
    const user= await User.findById(id);
    if(!user){
      res.status(400).json({ error: "Not Found User" });
      return;
      }

    const sendingUser={
      _id:user._id,
      username:user.username,
      email:user.email,
      address:user.address,
      contact:user.contact,
      currentDonation:user.currentDonation,
      currentRent:user.currentRent,
      monthRent:user.monthRent,
      totalDonation:user.totalDonation,
      role:user.role,
      shopName:user.shopName,
      monthStatus:user.monthstatus

    }
let order;
    if(orderId){
       order= await InvoiceModel.findOne({orderId:orderId});

    }

    res.json({ msg:sendingUser, downloadUrl:order?.downloadUrl, Url: order?.url });
    return;



  }catch(err){
    console.log(err)
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
})

authRouter.post("/signup",async (req: Request,res: Response)=>{

    try{
            
const {username, password, contact, address, shopName,email }= req.body;
const hashedPassword = await bcrypt.hash(password, 10);
const user = new User({
    username,
    password: hashedPassword,
    contact,
    address,
    shopName,
    email,
    role:"user"
    });

    const sendingUser={
      username:user.username,
      email:user.email,
      contact:user.contact,
      address:user.address,
      shopName:user.shopName,
      role:user.role

    }

    await user.save();

res.send("User added "+ sendingUser)
    }catch(err){
      res.status(400).json({message: "Error while signing up"});
        //console.log(err);
        
    }
})

authRouter.post("/logout", userAuth,async (req:Request, res:Response) => {
  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(0), 
  });
res.json({msg :"User Logged Out Successful!"} );


});


authRouter.get("/userInfo", verifyAcessToken,async (req:AuthRequest, res:Response) => {
  res.json({role: req.user?.role})
  return;

});

export default authRouter;
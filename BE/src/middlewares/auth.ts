import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/db";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { ObjectId } from "mongoose";
dotenv.config();
// 
// Extend Request type to include user

interface Iuser{
    username: string;
    email :string;
    contact: string;
    role: string;
    shopName: string;
    monthRent: Number;
    currentRent: Number;
    currentDonation: Number;
    totalDonation: Number;
    address?: string;
    id:string;
}
export interface AuthRequest extends Request {
    user?: Iuser;
}

export const userAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader =req.headers.authorization; 
        
        if (!authHeader || !authHeader.startsWith("Bearer ")    ) {
res.status(401).send("Please login!");
return;
        }
        
        const token = authHeader.split(" ")[1];
        const decodedObj = jwt.verify(token, process.env.JWT_KEY as string);

        // Ensure decodedObj is an object with _id
        if (typeof decodedObj === "string") {
            throw new Error("Invalid token");
        }

        const { _id } = decodedObj as JwtPayload; // Explicitly cast as JwtPayload
        const user = await User.findById(_id).lean();
        if (!user) {
            throw new Error("User not found");
        }

        req.user = {
            id:user._id.toString() ?? "",
            username: user.username ?? "",
            email: user.email ?? "",
            contact: user.contact ?? "",
            role: user.role ?? "",
            shopName: user.shopName ?? "",
            monthRent: user.monthRent ?? "",
            currentRent: user.currentRent ?? "",
            currentDonation: user.currentDonation ?? "",
            totalDonation: user.totalDonation ?? "",
            address: user.address ?? "",
        };
        
        next();
    } catch (err: any) {
        next(err)
    }
};



export const verifyAcessToken=  (req:AuthRequest,res:Response,next:NextFunction)=>{
    try{
        const token =req.headers.authorization?.split(" ")[1];
        
        if(!token){
            res.status(401).send("Unauthorized");
            return;
        }
        jwt.verify(token, process.env.JWT_KEY as string,async (err,decoded:any)=>{
            if(err || !decoded?._id) {res.status(403).json({error:"invalid Token"})
            return;}

            const _id=decoded._id;
            const user = await User.findById(_id).lean();
            if (!user) {
                throw new Error("User not found");
            }
            req.user = {
                id:user._id.toString() ?? "",
                username: user.username ?? "",
                email: user.email ?? "",
                contact: user.contact ?? "",
                role: user.role ?? "",
                shopName: user.shopName ?? "",
                monthRent: user.monthRent ?? "",
                currentRent: user.currentRent ?? "",
                currentDonation: user.currentDonation ?? "",
                totalDonation: user.totalDonation ?? "",
                address: user.address ?? "",
            };
            
            next();


        });



    }catch(err){
        res.status(500).json({error:"Internal Server Error"})
    }
}


export const checkAdmin = async(req:AuthRequest, res:Response, next:NextFunction)=>{
    try{
        if(req.user && req.user.role!="admin" ){
            res.status(403).send("Auth error A-404");
            return;
        }
        else{
            next();
        }
}catch(err){
    next(err);
}
};
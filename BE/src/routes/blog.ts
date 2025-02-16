import express from "express"
import { Request,Response } from "express";
import {BlogsModel} from "../models/db"
import { userAuth,AuthRequest } from "../middlewares/auth";
const blogRouter= express.Router();



blogRouter.post("/create", userAuth ,async(req:AuthRequest,res:Response)=>{
try{
    // heading : {type: String, required: true},
    // dateTime : {type: Date, required: true, default: Date.now},
    // location : {type: String, required: true},
    // titleBody : [{title: String,
    //               body: String
    //             }]
    const {heading, dateTime, location, titleBody}= req.body;
const blog= new BlogsModel({
    heading:heading,
    dateTime:dateTime,
    location:location,
    titleBody:titleBody


})
await blog.save();
res.status(201).json(blog);
}catch(err:any){
    res.status(500).json({message:err.message});
}

})


blogRouter.delete("/delete",userAuth, async (req:AuthRequest,res:Response)=>{
    try{
        const id=req.body.id;
        const blog=await BlogsModel.findByIdAndDelete(id);
        if(!blog){
             res.status(404).json({message:"Blog not found"})
             return;
            }
            res.status(200).json(blog);
            }catch(err:any){
                res.status(500).json({message:err.message});
                }
})

blogRouter.get("/all",userAuth ,async (req: AuthRequest, res: Response) => {
    try {
        const blogs = await BlogsModel.find();
        if (!blogs || blogs.length === 0) {
res.status(404).json({ message: "No blogs found" });
return;
        }
        res.status(200).json(blogs);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});


export default blogRouter;
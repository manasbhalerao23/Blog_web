"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../models/db");
const auth_1 = require("../middlewares/auth");
const multer_1 = __importDefault(require("../middlewares/multer"));
const cloudinary_1 = __importStar(require("../utils/cloudinary"));
const blogRouter = express_1.default.Router();
blogRouter.get("/collection", auth_1.checkAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blog_id = req.query.blog_id;
        const resp = yield db_1.paymentModel.find({
            "notes.donationId": blog_id,
            "notes.paymentType": "donation"
        }).populate("notes.userId", "username email contact").exec();
        res.status(200).json({ resp });
    }
    catch (e) {
        console.log(e);
    }
}));
blogRouter.post("/create", auth_1.verifyAcessToken, auth_1.checkAdmin, multer_1.default.array("images", 6), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let imgUrlArr = [];
        // console.log("Waiting 500ms to ensure files are ready...");
        // await new Promise(resolve => setTimeout(resolve, 500));
        if (req.files) {
            // Keep Cloudinary connection "warm" on server start
            for (const file of req.files) {
                try {
                    const result = yield cloudinary_1.default.uploader.upload(file.path, {
                        resource_type: "auto",
                        timeout: 30000,
                    });
                    imgUrlArr.push(result.url);
                }
                catch (err) {
                    console.error("Cloudinary Upload Error:", err);
                    imgUrlArr.push(null); // Push null or handle the error gracefully
                    res.status(500).json({ message: err });
                    return;
                }
            }
        }
        // console.log(req.files);
        // console.log(req.body);
        const { heading, dateTime, location, body } = req.body;
        const blog = new db_1.BlogsModel({
            heading: heading,
            dateTime: dateTime,
            location: location,
            body: body,
            images: imgUrlArr
        });
        yield blog.save();
        res.status(201).json(blog);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}));
blogRouter.delete("/delete/:id", auth_1.verifyAcessToken, auth_1.checkAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const blog = yield db_1.BlogsModel.findByIdAndDelete(id);
        if (!blog) {
            res.status(404).json({ message: "Blog not found" });
            return;
        }
        blog.images.map((e) => {
            (0, cloudinary_1.deleteImage)(e);
        });
        res.status(200).json(blog);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}));
blogRouter.get("/all", auth_1.verifyAcessToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blogs = yield db_1.BlogsModel.find();
        if (!blogs || blogs.length === 0) {
            res.status(200).json({ message: "No blogs found" });
            return;
        }
        res.status(200).json(blogs);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}));
//check point for url
blogRouter.get("/open/:blogId", auth_1.verifyAcessToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { blogId } = req.params;
        //console.log(blogId);
        const blog = yield db_1.BlogsModel.findById(blogId);
        if (!blog) {
            res.status(200).json({
                message: "Empty blog"
            });
            return;
        }
        res.status(200).json(blog);
        return;
    }
    catch (e) {
        res.status(500).json({
            message: e.message
        });
        return;
    }
}));
exports.default = blogRouter;

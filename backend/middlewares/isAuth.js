import jwt from "jsonwebtoken";
import { redisClient } from "../index.js";
import { User } from "../models/User.js";
import { RedisClient } from "redis";

export const isAuth = async(req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(403).json({
         message:"please Login - no token",
      });
    }

    const decodeData = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodeData) {
      return res.status(400).json({
        message: "token expired",
      });
    }

    const cacheUser = await redisClient.get(`user:${decodeData.id}`);
    if (cacheUser) {
      req.user = JSON.parse(cacheUser);
      return next();
    }

    const user = await User.findById(decodeData.id).select("-password");

    if (!user) {
      return res.status(400).json({
        message: "no user with this id",
      });
    }

    await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user));

    req.user = user;
    next();
  } catch (error){
   res.status(500).json({
    message:error.message,
   })
  }
}
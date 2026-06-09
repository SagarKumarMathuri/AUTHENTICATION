import jwt from "jsonwebtoken";

export const isAuth = async(req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(403).json({
         message:"please Login - no token",
      });
    }

    const decodeData = jwt.verify(token, process.env.JWT_SECRET);

    
  } catch (error){
   
  }
}
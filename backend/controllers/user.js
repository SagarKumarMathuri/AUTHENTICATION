import { registerSchema } from "../config/zod.js";
import {redisClient} from "../index.js";
import TryCatch from "../middlewares/TryCatch.js";
import sanitize from "mongo-sanitize";
import {User} from "../models/User.js"
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import sendMail from '../config/sendMail.js'
import {getVerifyEmailHtml} from "../config/html.js"

export const registerUser = TryCatch(async (req, res) => {
  const sanitezedBody = sanitize(req.body);

  const validation = registerSchema.safeParse(sanitezedBody);

  if (!validation.success) {
    const zodError = validation.error;

    let firstErrorMessage = "Validation failed";
    let allErrors = []
    if(zodError?.issues && Array.isArray(zodError.issues)){
      allErrors = zodError.issues.map((issue) => ({
        field : issue.path ? issue.path.join(".") : "unknown",
        message: issue.message || "Validation Error",
        code: issue.code,
      }))
      firstErrorMessage = allErrors[0]?.message || "Validation Error";
    }
    return res.status(400).json({
      message: firstErrorMessage,
      error: allErrors
    });
  }

  const { name, email, password } = validation.data;

  const ratelimitKey = `register-rate-limit:${req.ip}:${email}`;
  
  if (await redisClient.get(ratelimitKey)) {
    return res.status(429).json({
      message:"Too many requests, try again later",
    })
  }

  const existingUser = await User.findOne({ email});

  if (existingUser) {
    return res.status(400).json({
      message:"User already exists",
    })
  }
 
  const hashPassword = await bcrypt.hash(password, 10);

  const verifyToken = crypto.randomBytes(32).toString("hex");

  const verifyKey =   `verify:${verifyToken}`
  
  const datatoStore = JSON.stringify({
    name,
    email,
    password:hashPassword,
  })

  await redisClient.set(verifyKey, datatoStore, {EX: 300});

  const subject = "verify your email for Account creation"
  
  const html =  getVerifyEmailHtml({email , token: verifyToken});

  await sendMail({email, subject, html});

  await redisClient.set(ratelimitKey, "true", {EX: 60})

  res.json({
    message:"If your email is valid, a verification like has been sent. it will expire in 5 minutes",
  });
});


export const verifyUser = TryCatch(async(req, res) =>{
  const {token} = req.params;
  if(token){
    return res.status(400).json({
      message:"Verification token is required.",
    })
  }

  const verifyKey = `verify:${token}`;

  const userDataJson = await redisClient.get(verifyKey)

  if(!userDataJson) {
    return res.status(400).json({
      message:"Verification Link is expired",
    })
  }
 
  await redisClient.del(verifyKey);

  const userData = JSON.parse(userDataJson)
  
  const existingUser = await User.findOne({ email: userData.email});

  if (existingUser) {
    return res.status(400).json({
      message:"User already exists",
    })
  }
})
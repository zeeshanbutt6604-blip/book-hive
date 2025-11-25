import catchAsyncError from "./catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// authenticated user
export const isAutheticated = catchAsyncError(async (req, res, next) => {
  const access_token = req.headers["access-token"];

  if (!access_token) {
    return next(new ErrorHandler("Please login to access this resource", 401));
  }
  
  try {
    // Try to verify the token
    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN || "");
    
    if (!decoded || !decoded.id) {
      return next(new ErrorHandler("Access token is not valid", 401));
    }

    // Token is valid, proceed
    req.user = decoded;
    next();
  } catch (error) {
    // Token verification failed
    if (error.name === "TokenExpiredError") {
      // Token expired, check for refresh token
      const refresh_token = req.headers["refresh-token"];
      
      if (refresh_token) {
        try {
          // Verify refresh token
          const refreshDecoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN || "");
          
          if (!refreshDecoded || !refreshDecoded.id) {
            return next(new ErrorHandler("Invalid refresh token", 401));
          }

          // Get user and generate new access token
          const user = await User.findById(refreshDecoded.id);
          
          if (!user) {
            return next(new ErrorHandler("User not found", 401));
          }

          // Generate new access token
          const newAccessToken = jwt.sign(
            { id: user._id },
            process.env.ACCESS_TOKEN || "",
            { expiresIn: "5m" }
          );

          // Set new token in response header (for client to update)
          res.setHeader("new-access-token", newAccessToken);
          
          // Set user in request and continue
          req.user = { id: user._id };
          next();
        } catch (refreshError) {
          return next(new ErrorHandler("Session expired. Please login again", 401));
        }
      } else {
        // No refresh token, ask user to login again
        return next(new ErrorHandler("Session expired. Please login again", 401));
      }
    } else if (error.name === "JsonWebTokenError") {
      return next(new ErrorHandler("Invalid access token", 401));
    } else {
      return next(new ErrorHandler("Authentication failed", 401));
    }
  }
});

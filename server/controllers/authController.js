import validator from "email-validator";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import catchAsyncError from "../middleware/catchAsyncErrors.js";
import sendMail from "../utils/sendMail.js";
import ErrorHandler from "../utils/errorHandler.js";
import sendToken from "../utils/jwtToken.js";
import User from "../models/userModel.js";

// Register user
export const register = catchAsyncError(async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate input
    if (!name || name.trim() === "") {
      return next(new ErrorHandler("Name is required", 400));
    }

    if (!email || email.trim() === "") {
      return next(new ErrorHandler("Email is required", 400));
    }

    if (!validator.validate(email)) {
      return next(new ErrorHandler("Invalid email format", 400));
    }

    if (!password || password.trim() === "") {
      return next(new ErrorHandler("Password is required", 400));
    }

    if (password !== confirmPassword) {
      return next(
        new ErrorHandler("Password and Confirm Password does not match!", 400)
      );
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error("Database connection state:", mongoose.connection.readyState);
      return next(new ErrorHandler("Database is not connected. Please check your MongoDB connection.", 503));
    }

    // Check for unique email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return next(new ErrorHandler("Email already exists", 400));
    }

    console.log("Creating new user with email:", email);

    // Create user directly
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
    });

    console.log("Saving user to database...");
    const savedUser = await user.save();
    
    if (!savedUser || !savedUser._id) {
      console.error("Failed to save user - no ID returned");
      return next(new ErrorHandler("Failed to create user account", 500));
    }

    console.log("User saved successfully with ID:", savedUser._id);

    // Generate verification token
    const verificationToken = savedUser.getToken(15);
    await savedUser.save({ validateBeforeSave: false });

    console.log("Verification token generated");

    // Send verification email (optional - don't fail registration if email fails)
    const verificationLink = `${process.env.CLIENT_BASE_URL || "http://localhost:5274"}/api/auth/activate-user/${verificationToken}`;
    try {
      await sendMail({
        email: savedUser.email,
        subject: "Activate your account",
        template: "activation-mail.ejs",
        data: {
          user: { name: savedUser.name },
          activationLink: verificationLink,
        },
      });
      console.log("Verification email sent successfully");
    } catch (emailError) {
      // Don't rollback user creation if email fails - just log it
      console.error("Failed to send verification email:", emailError.message);
      // User is still created, they can request a new token later
    }

    res.status(201).json({
      success: true,
      message: `User registered successfully! Please check your email: ${savedUser.email} to activate your account.`,
      activationToken: verificationToken,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        is_verified: savedUser.is_verified,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return next(new ErrorHandler(messages, 400));
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return next(new ErrorHandler("Email already exists", 400));
    }

    return next(new ErrorHandler(error.message || "Failed to register user", 400));
  }
});

// Activate user
export const activateUser = catchAsyncError(async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return next(new ErrorHandler("Activation token is required", 400));
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      token: hashedToken,
      tokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorHandler("Invalid or expired activation token", 400));
    }

    // Activate user
    user.is_verified = true;
    user.token = undefined;
    user.tokenExpire = undefined;
    user.tokenValidityInMinutes = undefined;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Account activated successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Login user
export const login = catchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler("Please enter email and password", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("Invalid email or password", 400));
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return next(new ErrorHandler("Invalid email or password", 400));
    }

    if (!user.is_verified) {
      return next(
        new ErrorHandler(
          "Please verify your email to access your account!",
          403
        )
      );
    }

    sendToken(user, 200, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Logout user
export const logoutUser = catchAsyncError(async (req, res, next) => {
  try {
    res.cookie("access_token", "", {
      expires: new Date(0),
      sameSite: "none",
      secure: true,
    });

    res.cookie("refresh_token", "", {
      expires: new Date(0),
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Update access token
export const updateAccessToken = catchAsyncError(async (req, res, next) => {
  try {
    const refresh_token = req.headers["refresh-token"];

    if (!refresh_token) {
      return next(new ErrorHandler("Refresh token is required", 400));
    }

    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN);

    if (!decoded) {
      return next(new ErrorHandler("Could not refresh token", 400));
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorHandler("User not found", 400));
    }

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN || "",
      { expiresIn: "5m" }
    );

    res.cookie("access_token", accessToken, {
      expires: new Date(Date.now() + 5 * 60 * 1000),
      maxAge: 5 * 60 * 1000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.status(200).json({
      success: true,
      accessToken,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Get user info
export const getUserInfo = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Get user by ID (public profile)
export const getUserById = catchAsyncError(async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const user = await User.findById(userId).select("name email profile_picture createdAt");

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Update user info
export const updateUserInfo = catchAsyncError(async (req, res, next) => {
  try {
    // Extract name from req.body (works with both JSON and multipart/form-data)
    // When using multer with multipart/form-data, text fields are in req.body
    const name = req.body?.name;
    const userId = req.user?.id;
    const user = await User.findById(userId);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Log received data for debugging
    console.log("Update user info - received data:", {
      name: name,
      nameType: typeof name,
      hasFile: !!req.file,
      bodyKeys: Object.keys(req.body || {}),
    });

    // Update name if provided
    // When using multipart/form-data with multer, text fields are in req.body
    if (name !== undefined && name !== null && name !== '') {
      const trimmedName = typeof name === 'string' ? name.trim() : String(name).trim();
      if (trimmedName && trimmedName.length > 0) {
        const oldName = user.name;
        user.name = trimmedName;
        console.log("✅ Updating user name from:", oldName, "to:", user.name);
      } else {
        console.log("⚠️ Name provided but empty or whitespace only");
      }
    } else {
      console.log("ℹ️ No name provided in request");
    }

    // Handle profile picture upload
    if (req.file) {
      // req.file.path is an absolute path like "D:\...\server\uploads\profile_picture-1234567890.jpg"
      // We need to extract just the relative path: "/uploads/profile_picture-1234567890.jpg"
      const filePath = req.file.path.replace(/\\/g, "/"); // Replace backslashes with forward slashes
      
      // Extract the relative path from uploads folder
      // Find the "uploads" folder in the path and get everything after it
      const uploadsIndex = filePath.indexOf("uploads/");
      if (uploadsIndex !== -1) {
        // Get the path starting from "uploads/"
        const relativePath = filePath.substring(uploadsIndex);
        // Ensure it starts with / for URL path
        user.profile_picture = `/${relativePath}`;
      } else {
        // Fallback: if "uploads/" not found, use filename directly
        user.profile_picture = `/uploads/${req.file.filename}`;
      }
      
      console.log("Profile picture saved:", {
        originalPath: req.file.path,
        savedPath: user.profile_picture,
        filename: req.file.filename
      });
    }

    await user.save();

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profile_picture: user.profile_picture, // Include profile_picture URL in response
        is_verified: user.is_verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Update user password
export const updatePassword = catchAsyncError(async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return next(new ErrorHandler("Please enter old and new password", 400));
    }

    const user = await User.findById(req.user?.id).select("+password");

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const isPasswordMatch = await user.comparePassword(oldPassword);

    if (!isPasswordMatch) {
      return next(new ErrorHandler("Invalid old password", 400));
    }

    user.password = newPassword;
    await user.save();

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Send reset password link
export const forgotPassword = catchAsyncError(async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorHandler("Email is required", 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorHandler("User not found with this email", 404));
    }

    // Generate reset token
    const resetToken = await user.getToken(15); // 15 minutes validity
    await user.save({ validateBeforeSave: false });

    // Send reset email
    const resetLink = `${process.env.CLIENT_BASE_URL}/api/auth/reset-password?token=${resetToken}`;

    try {
      await sendMail({
        email: user.email,
        subject: "Password Reset Link",
        template: "reset-password.ejs",
        data: {
          user: { name: user.name },
          resetLink: resetLink,
        },
      });

      res.status(200).json({
        success: true,
        message: "Password reset link sent to your email!",
      });
    } catch (error) {
      user.token = undefined;
      user.tokenExpire = undefined;
      user.tokenValidityInMinutes = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new ErrorHandler("Failed to send reset email", 500));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Reset password with token
export const resetPassword = catchAsyncError(async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return next(
        new ErrorHandler(
          "Token, new password and confirm password are required",
          400
        )
      );
    }

    if (newPassword !== confirmPassword) {
      return next(
        new ErrorHandler("Password and confirm password do not match", 400)
      );
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      token: hashedToken,
      tokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorHandler("Invalid or expired reset token", 400));
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.token = undefined;
    user.tokenExpire = undefined;
    user.tokenValidityInMinutes = undefined;
    await user.save();

    sendToken(user, 200, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Resend verification token
export const resendVerificationToken = catchAsyncError(
  async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) {
        return next(new ErrorHandler("Email is required", 400));
      }

      const user = await User.findOne({ email });

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      if (user.is_verified) {
        return next(new ErrorHandler("User is already verified", 400));
      }

      // Generate new verification token
      const verificationToken = await user.getToken(24 * 60); // 24 hours validity
      await user.save({ validateBeforeSave: false });

      // Send verification email
      const verificationLink = `${process.env.CLIENT_BASE_URL}/api/auth/activate-user?token=${verificationToken}`;

      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          template: "activation-mail.ejs",
          data: {
            user: { name: user.name },
            activationLink: verificationLink,
          },
        });

        res.status(200).json({
          success: true,
          message: "Verification email sent successfully!",
        });
      } catch (error) {
        user.token = undefined;
        user.tokenExpire = undefined;
        user.tokenValidityInMinutes = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler("Failed to send verification email", 500));
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

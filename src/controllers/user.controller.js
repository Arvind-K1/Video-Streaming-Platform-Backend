import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}


const registerUser = asyncHandler( async (req,res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists : username, email
    // check for images, check for avatar
    //upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response 
    // check for user creation
    // return response
    
    const { fullname, email, username, password } = req.body

    if(
        [fullname, email, username, password].some((field) => field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser){
        throw new ApiError(409,"User already exist")
    }

    // files exceses given by multer in req.files
    const avatarLocalPath = req.files?.avatar[0]?.path;

    //As this will not check if coverImage is not present
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    //correct approach: 
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
 
    if (!avatar){
        throw new ApiError(400,"avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()

    })

    //select with - is used to deselect the field
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User register Successfully")
    )
})

const loginUser = asyncHandler( async (req,res) => {
    // req body -> data
    // username or email
    // find the user
    // password check 
    // access and refresh token 
    // send cookie 
    // response send 

    const { email, username, password} = req.body

    if (!(username || email)){
        throw new ApiError(400,"Username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid){
        throw new ApiError(401,"Invalid password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,accessToken, refreshToken
                    },
                    "User Logged In Successfully"
                )
            )

})

const loggoutUser = asyncHandler( async(req,res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            // $set: { refreshToken: undefined }
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(
            new ApiResponse(200,{},"User Logged Out")
        )
})

const refreshAccessToken = asyncHandler( async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if( incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newRefreshToken,options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken,refreshToken:newRefreshToken},
                    "Access token refreshed"
    
                )
            )
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
}
})

const changeCurrentPassword = asyncHandler( async(req,res) => {
    const {oldPassword,newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if( !isPasswordCorrect ){
        throw new ApiError(400,"Old password is incorrect")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res.status(200).json(
        new ApiResponse(200,{},"Password changed")
    )
})

const getCurrentUser = asyncHandler( async(req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "current user fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler( async(req, res) => {
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiError(400,"All Fields are required")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname, // other way - email: email
                email
            },
            
        },
        {
            new: true, //this will return the new save data
        }
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Account details updated successfully"
        )
    )

})

//file update controller
const updateUserAvatar = asyncHandler( async(req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Please upload an avatar")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Avatar upload failed")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Avatar updated Succesfully"
            )
        )
})

const updateUserCoverImage = asyncHandler( async(req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Please upload an cover Image")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Cover Image upload failed")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Cover Image Updated successfully"
            )
        )
})


const getUserChannelProfile = asyncHandler( async(req,res) => {
    const {username} = req.params

    if (!username){
        throw new ApiError(400,"Username is missing")
    }

    const channel = await User.aggregate([{
        $match: {
            username: username?.toLowerCase()
        }
    },{
        $lookup: {
            from: "subscriptions", //As in database Subscription save with -- subscriptions
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    },{
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        }
    },{
        $addFields: {
            subscribersCount: {
                $size: "$subscribers"
            },
            channelsSubscribedToCount: {
                $size: "$subscribedTo"
            },
            isSubscribed: {
                $cond: {
                    if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                    then: true,
                    else: false
                }
            }
        }
    },{
        $project: {
            fullname: 1, //this 1 is flag that means only flag with 1 will be projected
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1

        }
    }])

    //console.log(channel);
    //aggregation Pipline return array of the object 

    if(!channel?.length){
        throw new ApiError(404,"channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200,channel[0],"User channel fetched successfully")
        )
})



const getWatchHistory = asyncHandler( async(req, res) => {
    // req.user._id return string value of id but not exact mongoose _id

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id) // retrun mongoose _id 
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                // to implement nested pipline to get details from user by owner field in videos we do this
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            // to display only few details we do again nested pipline and this data goes in the owner field
                            pipeline: [
                                {
                                    $project:{
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    //As owner is array of the object so we again write pipline and overrwrite the value of owner and return array of the required object
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        )
})


export { 
    registerUser,
    loginUser,
    loggoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
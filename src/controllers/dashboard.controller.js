import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
   const { userId } = req.params;

   // Get total number of Videos
   const videoCount = await Video.countDocuments({ owner: userId });

   // Get total views
   const videos = await Video.find({ owner:userId });
   const totalViews = videos.reduce((acc, video) => acc + video.views, 0);

   // Get total like
   const likes = await Like.find({ video: { $in: videos.map(video => video._id) } });
    const totalLikes = likes.length;

    // Get total comments 
    const comments = await Comment.find({ video: { $in: videos.map(video => video._id) } });
    const totalComments = comments.length;

    return res
        .status(200)
        .json(new ApiResponse(200, { videoCount, totalViews, totalLikes, totalComments }, "Data fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const videos = await Video.find({ owner: userId });
    
    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Data fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }
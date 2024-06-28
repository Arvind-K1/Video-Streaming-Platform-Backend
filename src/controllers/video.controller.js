import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find();
     if(!videos){
        throw new ApiError("No videos found", 404)
     }

     return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { videoFile, thumbnail, title, description, duration, owner} = req.body
    const newVideo = new Video({
        videoFile,
        thumbnail,
        title,
        description,
        duration,
        owner
    }) 
    const savedVideo = await newVideo.save();

    return res
        .status(200)
        .json(new ApiResponse(200, savedVideo, "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description, thumbnail, videoFile, duration } = req.body;
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { title, description, thumbnail, videoFile, duration },
      { new: true }
    );
    
    if(!updatedVideo){
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId);
    
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    video.published = !video.published
    const updatedVideo = await video.save();    

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video published status updated successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
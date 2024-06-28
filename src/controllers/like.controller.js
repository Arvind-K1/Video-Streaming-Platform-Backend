import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleLike = async (userId, targetId, targetType) => {
    let like;
    switch (targetType) {
        case 'Video':
            like = await Like.findOne({ likedBy: userId, video: targetId });
            break;
        case 'Comment':
            like = await Like.findOne({ likedBy: userId, commnet: targetId });
            break;
        case 'Tweet':
            like = await Like.findOne({ likedBy: userId, tweet: targetId });
            break;
        default:
            throw new ApiError(400, 'Invalid target type');
    }

    if (like) {
        await Like.findByIdAndDelete(like._id);
        return { liked: false };
      } else {
        const newLike = new Like({ likedBy: userId });
        if (targetType === 'Video') newLike.video = targetId;
        if (targetType === 'Comment') newLike.comment = targetId;
        if (targetType === 'Tweet') newLike.tweet = targetId;
        await newLike.save();
        return { liked: true };
      }
};

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId, userId} = req.params;
    
    const result = await toggleLike(userId, videoId, 'Video');
    return res
        .status(200)
        .json(new ApiResponse(
            201,
            result,
            'Video liked successfully'
        ))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId, userId} = req.params
    const result = await toggleLike(userId, commentId, 'Comment');

    return res 
    .status(200)
    .json(new ApiResponse(
        201,
        result,
        'Comment liked successfully'
        ))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId, userId} = req.params
    const result = await toggleLike(userId, tweetId, 'Tweet');

    return res
        .status(200)
        .json(new ApiResponse(
            201,
            result,
            'Tweet liked successfully'
            ))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const likes = await Like.find({ likedBy: userId, video: { $ne: null } }).populate('video');
    const likedVideos = likes.map(like => like.video);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            likedVideos,
            'Liked videos retrieved successfully'
            ))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
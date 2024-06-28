import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {owner, content} = req.body;
    const newTweet = new Tweet({
        owner,
        content
    });

    const savedTweet = await newTweet.save();

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            savedTweet,
            "Tweet created successfully",

        ))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    const tweets = await Tweet.find({ userId }).sort({ createdAt: -1 });

    if(!tweets){
        throw new ApiError(404, "No tweets found")
    }
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        tweets,
        "Tweets found successfully",
        ))
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, { content }, {new: true});

    if(!updatedTweet){
        throw new ApiError(404, "Tweet not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated successfully",
            ))

})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if(!deletedTweet){
        throw new ApiError(404, "Tweet not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            deletedTweet,
            "Tweet deleted successfully",
            ))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
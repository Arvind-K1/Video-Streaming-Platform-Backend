import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {userId, channelId} = req.params;

    //check if subscription already exists
    const subscription = await Subscription.findOne({userId, channelId})
    if (subscription) {
        await Subscription.findByIdAndDelete(subscription._id);
        return res
            .status(200)
            .json(new ApiResponse(200,"", "Unsubscribed"))
    }
    else {
        // if subscription does not exist, create it (subscribe)
        const newSubscription = await Subscription.create({userId, channelId})
        await newSubscription.save();

        return res
        .status(200)
        .json(new ApiResponse(200,"", "Subscribed"))
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscribers = await Subscription.find({ channel: channelId }).populate('subscriber');

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Subscribers"))

})

// controller to  return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const subscribedChannels = await Subscription.find({ subscriber: subscriberId }).populate('channel');

    return res
    .status(200)
    .json(new ApiResponse(200, subscribedChannels, "Subscribed Channels"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
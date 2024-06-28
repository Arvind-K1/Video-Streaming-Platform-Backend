import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const comments = await Comment.find({videoId}).populate('owner','username');

    if(!comments){
        throw new ApiError('No comments found', 404)
    }

    return res
        .status(200)
        .json(new ApiResponse(
        200,
        comments,
        'Comments fetched successfully'
    ))


})

const addComment = asyncHandler(async (req, res) => {
    const {video, owner, content} = req.body;
    const newComment = new Comment({
        video,
        owner,
        content
    });
    if(!newComment){
        throw new ApiError('Invalid comment', 400)
    }

    const savedComment = await newComment.save();

    return res
        .status(200)
        .json(new ApiResponse(
        201,
        savedComment,
        'Comment added successfully'
    ))
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;

    const updatedComment = await Comment.findByIdAndUpdate(commentId, { content }, { new: true });

    if(!updateComment){
        throw new ApiError('Comment not found', 404)
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedComment,
            'Comment updated successfully'
        ))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if(!deletedComment){
        throw new ApiError('Comment not found', 404)
        }
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            deletedComment,
            'Comment deleted successfully'
            ))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/:videoId").get(verifyJWT,getVideoComments).post(addComment);
router.route("/c/:commentId").delete(verifyJWT,deleteComment).patch(updateComment);
router.route("/comments").post(verifyJWT,addComment);
router.route("/c/:commentId").put(verifyJWT,updateComment);

export default router

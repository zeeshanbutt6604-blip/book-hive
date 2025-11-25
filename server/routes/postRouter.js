import express from "express";
import {
  getPosts,
  getPost,
  createPostHandler,
  updatePostHandler,
  deletePostHandler,
} from "../controllers/postController.js";
import {
  getComments,
  createOrUpdateComment,
  deleteCommentHandler,
} from "../controllers/commentController.js";
import { createPostValidation, updatePostValidation } from "../middleware/formValidation/postFormValidation.js";
import { createCommentValidation } from "../middleware/formValidation/commentFormValidation.js";
import { isAutheticated } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64f8a1b2c3d4e5f6a7b8c9d0"
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       title:
 *                         type: string
 *                         example: "Introduction to React Native"
 *                       description:
 *                         type: string
 *                         example: "A comprehensive guide to React Native development"
 *                       bookType:
 *                         type: string
 *                         enum: [pdf, epub, document, image, referred_link]
 *                         example: "pdf"
 *                       fileUrl:
 *                         type: string
 *                         example: "/uploads/file-1234567890.pdf"
 *                       previewimage:
 *                         type: string
 *                         example: "/uploads/preview-1234567890.jpg"
 *                       linkUrl:
 *                         type: string
 *                         example: "https://example.com/book"
 *                       linkImage:
 *                         type: string
 *                         example: "https://example.com/preview.jpg"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Bad request
 */
router.get("/", getPosts);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a single post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *         example: "64f8a1b2c3d4e5f6a7b8c9d0"
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 post:
 *                   type: object
 *       404:
 *         description: Post not found
 */
router.get("/:id", getPost);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - accessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: ['title', 'description', 'bookType']
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Introduction to React Native"
 *               description:
 *                 type: string
 *                 example: "A comprehensive guide to React Native development"
 *               bookType:
 *                 type: string
 *                 enum: [pdf, epub, document, image, referred_link]
 *                 example: "pdf"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Book file (required if bookType is not referred_link)
 *               previewimage:
 *                 type: string
 *                 format: binary
 *                 description: Preview image
 *               linkUrl:
 *                 type: string
 *                 example: "https://example.com/book"
 *                 description: Required if bookType is referred_link
 *               linkImage:
 *                 type: string
 *                 example: "https://example.com/preview.jpg"
 *                 description: Required if bookType is referred_link
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Post created successfully"
 *                 post:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  isAutheticated,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "previewimage", maxCount: 1 },
  ]),
  createPostValidation,
  createPostHandler
);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post (only post owner)
 *     tags: [Posts]
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               bookType:
 *                 type: string
 *                 enum: [pdf, epub, document, image, referred_link]
 *               file:
 *                 type: string
 *                 format: binary
 *               previewimage:
 *                 type: string
 *                 format: binary
 *               linkUrl:
 *                 type: string
 *               linkImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       403:
 *         description: Not authorized (not post owner)
 *       404:
 *         description: Post not found
 */
router.put(
  "/:id",
  isAutheticated,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "previewimage", maxCount: 1 },
  ]),
  updatePostValidation,
  updatePostHandler
);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post (only post owner)
 *     tags: [Posts]
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Not authorized (not post owner)
 *       404:
 *         description: Post not found
 */
router.delete("/:id", isAutheticated, deletePostHandler);

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Get all comments for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       postId:
 *                         type: string
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       text:
 *                         type: string
 *                         example: "Great book! Very informative."
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get("/:postId/comments", getComments);

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Add or update a comment
 *     tags: [Comments]
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *       - in: query
 *         name: commentId
 *         schema:
 *           type: string
 *         description: Comment ID (optional, if provided will update instead of create)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['text']
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Great book! Very informative."
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/:postId/comments",
  isAutheticated,
  createCommentValidation,
  createOrUpdateComment
);

/**
 * @swagger
 * /api/posts/{postId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Not authorized (not comment owner)
 *       404:
 *         description: Comment not found
 */
router.delete("/:postId/comments/:commentId", isAutheticated, deleteCommentHandler);

export default router;


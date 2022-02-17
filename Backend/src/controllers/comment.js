const User = require("../models/User");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

module.exports = {
  index: async (req, res, next) => {
    const comments = await Comment.find({});
    return res.status(200).json({
      success: true,
      comments,
    });
  },

  createComment: async (req, res, next) => {
    const { sub } = req.payload; //userId parses from access token
    const { content, postSlug } = req.verified.body;
    const user = await User.findById(sub);
    const post = await Post.findOne({ slug: postSlug });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Slug not match any post",
      });
    }

    const comment = new Comment({
      author_id: user._id,
      author_name: user.user_name,
      post: post._id,
      content,
    });

    await comment.save();
    post.comments.push(comment._id);
    user.comments.push(comment._id);
    await post.save();
    await user.save();

    res.status(201).json({
      success: true,
      comment,
    });
  },

  deleteComment: async (req, res, next) => {
    const { sub } = req.payload;
    const commentId = req.params.id;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "comment id is not valid",
      });
    }

    const user = await User.findById(sub);
    const post = await Post.findById(comment.post);
    //check roles
    if (user.roles.find((role) => role === "admin")) {
      const ownerPost = await User.findById(comment.author_id);
      await comment.remove();
      //remove comment in post & user
      await post.comments.pull(comment);
      await ownerPost.comments.pull(comment);
      return res
        .status(200)
        .json({ success: true, message: "comment has been deleted by admin" });
    } else if (user._id.toString() === comment.author_id.toString()) {
      await comment.remove();
      //remove comment in post & user
      await post.comments.pull(comment);
      await user.comments.pull(comment);
      return res
        .status(200)
        .json({ success: true, message: "comment has been deleted by owner" });
    }

    await user.save();
    await post.save();

    return res.status(401).json({ success: false, message: "Unauthorized" });
  },
};

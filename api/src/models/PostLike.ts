import mongoose, { Schema } from 'mongoose';

const postLikeSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'post_likes',
  },
);

postLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const PostLike = mongoose.model('PostLike', postLikeSchema);

import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const commentSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    body: { type: String, required: true, maxlength: 2000 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'comments',
  },
);

commentSchema.index({ postId: 1, createdAt: -1 });

export type CommentDocument = InferSchemaType<typeof commentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const Comment = mongoose.model('Comment', commentSchema);

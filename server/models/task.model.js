const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const taskSchema = new Schema(
  {
    serialNumber: {
      type: Number,
      required: true,
      default: 0
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    status: {
      type: String,
      required: true,
      enum: ['todo', 'doing', 'done'],
      default: 'todo'
    },
    type: {
      type: String,
      required: true,
      default: 'tech',
      validate: {
        validator: function(value) {
          // Allow predefined types
          const predefinedTypes = ['tech', 'review', 'bug', 'feature', 'documentation'];
          if (predefinedTypes.includes(value)) {
            return true;
          }
          // Allow custom types (alphanumeric with hyphens and underscores)
          const customTypeRegex = /^[a-zA-Z0-9-_]+$/;
          return customTypeRegex.test(value);
        },
        message: 'Type must be either a predefined type (tech, review, bug, feature, documentation) or a custom type containing only letters, numbers, hyphens, and underscores'
      }
    },
    deadline: {
      type: Date
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    comments: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      text: {
        type: String,
        required: [true, 'Comment text is required'],
        trim: true,
        maxlength: [1000, 'Comment cannot be more than 1000 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true
  }
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ deadline: 1 });

taskSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastTask = await this.constructor.findOne({ projectId: this.projectId })
      .sort({ serialNumber: -1 });
    this.serialNumber = lastTask ? lastTask.serialNumber + 1 : 1;
  }
  next();
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;

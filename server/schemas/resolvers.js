const { User } = require("../models");
const { AuthenticationErorr } = require("apollo-server-express");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select("-__v -password")
          .populate("books");

        return userData;
      }

      throw new AuthenticationErorr("You are not Logged in");
    },
  },
  Mutation: {
    // mutation to add data for a user, creates a token

    addUser: async (parent, args) => {
      try {
        const user = await User.create(args);

        const token = signToken(user);
        return { token, user };
      } catch (err) {
        console.log(err);
      }
    },

    // mutation for logging in. finds one user and checks for correct password and throws an auth error if incorrect details are entered

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Incorrect Login Details");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect Login Details");
      }

      const token = signToken(user);
      return { token, user };
    },

    // mutation to save a book via input data

    saveBook: async (parent, args, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },

          { $addToSet: { savedBooks: args.input } },
          { new: true, runValidators: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError("You need to be logged in!");
    },

    // mutation to remove a book based on finding one by id

    removeBook: async (parent, args, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: args.bookId } } },
          { new: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError("You need to be logged in!");
    },
  },
};

module.exports = resolvers;

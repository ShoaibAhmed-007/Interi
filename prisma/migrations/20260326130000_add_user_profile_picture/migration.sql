-- Add missing User.profilePicture column to migration history
ALTER TABLE "User" ADD COLUMN "profilePicture" TEXT;

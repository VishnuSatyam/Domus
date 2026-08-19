const { cloudinary } = require("../cloudconfig.js");
const ExpressError = require("./ExpressError.js");

function imageFromUpload(file) {
  return { url: file.path, filename: file.filename, publicId: file.filename };
}

async function deleteImage(image) {
  // `filename` was the public id in older records; publicId is explicit on new ones.
  const publicId = image && (image.publicId || image.filename);
  if (!publicId || !String(publicId).startsWith("domus_DEV/")) return;

  const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new ExpressError("Unable to remove the listing image. Please try again.", 502);
  }
}

module.exports = { imageFromUpload, deleteImage };

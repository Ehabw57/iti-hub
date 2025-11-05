module.exports = function (req, res, next) {
  console.log("Upload middleware triggered");
  next();
};

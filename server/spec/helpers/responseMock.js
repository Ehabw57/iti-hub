module.exports = function () {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (obj) {
    this.body = obj;
    return this;
  };
  res.send = function (data) {
    this.body = data;
    return this;
  };
  return res;
};

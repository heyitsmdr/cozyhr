module.exports = {
  env: function(req, res) {
    res.json(process.env);
  }
};
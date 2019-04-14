module.exports = function(api) {
  api.cache(false)
  return {
    plugins: ["@babel/transform-modules-commonjs"]
  }
}
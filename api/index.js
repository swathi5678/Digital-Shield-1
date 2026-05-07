module.exports = async (req, res) => {
  const { default: app } = await import('../server/src/app.js');
  app(req, res);
};

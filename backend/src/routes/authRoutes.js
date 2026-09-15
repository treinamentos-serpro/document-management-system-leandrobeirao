const express = require('express');

function createAuthRoutes(controller) {
  const router = express.Router();

  router.post('/auth/register', controller.register);
  router.post('/auth/login', controller.login);

  return router;
}

module.exports = createAuthRoutes;
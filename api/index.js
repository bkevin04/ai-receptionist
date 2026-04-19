/**
 * Vercel Serverless Entry Point
 *
 * Wraps the Express app so Vercel can route all requests through it.
 */

const app = require("../src/index");

module.exports = app;

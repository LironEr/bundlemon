// Same handler as serverless.js, deployed as a separate Vercel function so it can have a longer maxDuration (cron tasks, init DB)
module.exports = require('./serverless.js');

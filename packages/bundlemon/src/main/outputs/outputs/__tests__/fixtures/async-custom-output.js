const asyncOutput = (report) => {
  console.log('Hello from fixture!');
  return Promise.resolve(report);
};

module.exports = asyncOutput;

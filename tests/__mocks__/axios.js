module.exports = {
  post: jest.fn(() => Promise.resolve({ data: { choices: [{ message: { content: "This is a mock AI response." } }] } }))
};

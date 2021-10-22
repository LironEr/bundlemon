class FetchError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
  }
}

export default FetchError;

import * as consts from '../consts';

describe('consts', () => {
  test('snapshot', () => {
    expect(consts).toMatchSnapshot();
  });
});

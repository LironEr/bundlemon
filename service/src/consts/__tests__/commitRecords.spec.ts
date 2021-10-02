import * as consts from '../commitRecords';

describe('consts', () => {
  test('snapshot', () => {
    expect(consts).toMatchSnapshot();
  });
});

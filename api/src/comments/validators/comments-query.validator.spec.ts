import { CommentsQueryValidator } from './comments-query.validator.js';

describe('CommentsQueryValidator', () => {
  let validator: CommentsQueryValidator;

  beforeEach(() => {
    validator = new CommentsQueryValidator();
  });

  it('должен быть определён', () => {
    expect(validator).toBeDefined();
  });
});

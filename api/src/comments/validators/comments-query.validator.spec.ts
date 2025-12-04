import { CommentsQueryValidator } from './comments-query.validator';

describe('CommentsQueryValidator', () => {
  let validator: CommentsQueryValidator;

  beforeEach(() => {
    validator = new CommentsQueryValidator();
  });

  it('должен быть определён', () => {
    expect(validator).toBeDefined();
  });
});

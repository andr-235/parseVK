import { GroupMapper } from './group.mapper.js';
import type { IGroup } from '../../vk/interfaces/group.interfaces.js';

describe('GroupMapper', () => {
  let mapper: GroupMapper;

  beforeEach(() => {
    mapper = new GroupMapper();
  });

  it('должен маппить данные группы', () => {
    const groupData: IGroup = {
      id: 123,
      name: 'Test Group',
      screen_name: 'testgroup',
      is_closed: 0,
      deactivated: undefined,
      type: 'page',
      photo_50: 'photo50.jpg',
      photo_100: 'photo100.jpg',
      photo_200: 'photo200.jpg',
      activity: 'active',
      age_limits: 0,
      description: 'Test description',
      members_count: 1000,
      status: 'open',
      verified: 1,
      wall: 1,
      addresses: undefined,
      city: undefined,
      counters: undefined,
    };

    const result = mapper.mapGroupData(groupData);

    expect(result).toMatchObject({
      name: 'Test Group',
      screenName: 'testgroup',
      isClosed: 0,
      type: 'page',
      photo50: 'photo50.jpg',
      photo100: 'photo100.jpg',
      photo200: 'photo200.jpg',
      membersCount: 1000,
      verified: 1,
    });
  });
});

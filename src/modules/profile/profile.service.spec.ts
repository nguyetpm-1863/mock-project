import { UserRole } from '../../common/enums/user-role.enum.js';
import type { UsersService } from '../users/users.service.js';
import { ProfileService } from './profile.service.js';

describe('ProfileService', () => {
  const usersService = { updateName: vi.fn() };
  const service = new ProfileService(usersService as unknown as UsersService);
  const user = {
    id: 'user-id',
    email: 'jane@example.com',
    name: 'Jane',
    role: UserRole.User,
    createdAt: new Date(),
  };

  it('returns the profile with the new name after one update', async () => {
    usersService.updateName.mockResolvedValueOnce(true);

    await expect(service.updateName(user, 'Jane Doe')).resolves.toEqual({
      ...user,
      name: 'Jane Doe',
    });
    expect(usersService.updateName).toHaveBeenCalledWith('user-id', 'Jane Doe');
  });

  it('rejects the token when the user no longer exists', async () => {
    usersService.updateName.mockResolvedValueOnce(false);

    await expect(service.updateName(user, 'Jane Doe')).rejects.toMatchObject({
      status: 401,
    });
  });
});

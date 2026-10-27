import { UserName } from '../../../common/decorators/user-name.decorator.js';

export class UpdateProfileDto {
  @UserName()
  name: string;
}

import { UserDoc } from '../../models/user';
import UserDto from '../../../shared/dto/UserDto';

export default class UserService {
	// Build user DTO to transfer it to the client
	public static buildUserDto(user: UserDoc): UserDto {
		const { _id, username, accountID, isAdmin, email } = user;
		return {
			id: _id,
			username,
			accountID,
			isAdmin,
			email
		}
	}

	// todo:
	// search, full-text search with offset/limi
}
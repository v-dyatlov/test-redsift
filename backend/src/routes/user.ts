import express, { Request, RequestHandler, Response } from 'express';
import UserDto from '../../../shared/dto/UserDto';
import { User } from '../../models/user';
import GithubService from '../services/GithubService';
import UserService from '../services/UserService';

const router = express.Router();

// get list of users for the dashboard
// only for admins
router.get('/api/user/list', async (req: Request, res: Response) => {
	const { user } = req;
	if (!user || !user.isAdmin) {
		res.sendStatus(403).jsonp('Unauthorized');
	}

	// get search params
	const { search, offset, limit } = req.body;
	
	//based on the search call UserService to retrieve all users
	const users = await UserService.getUsers(search, offset, limit);

	return res.redirect(GithubService.buildAuthorizeUrl());
});


export { router as userRouter }
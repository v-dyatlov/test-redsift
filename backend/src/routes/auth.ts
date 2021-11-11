import express, { Request, Response } from 'express';
import { User } from '../../models/user';
import GithubService from '../services/GithubService';
import UserService from '../services/UserService';
import TokenHelper from '../TokenHelper';
import IAccessTokenResponse from '../types/IAccessTokenResponse';
import { IGithubResponse } from '../types/IGithubUser';


const router = express.Router()

router.get('/api/sso', (req: Request, res: Response) => {
  return res.redirect(GithubService.buildAuthorizeUrl());
});

router.post('/api/sso/verify', async (req: Request, res: Response) => {
	const { code } = req.body;
  
	const { accessToken }: IAccessTokenResponse = await GithubService.getAccessToken(code!);

	// if there is an error, then return error message and indicator
	if (!accessToken) {
		res.sendStatus(406).jsonp('No access token');
	}

	// get user information from the github
	const {success: userSuccess, message: userError, user: githubUser}: IGithubResponse = await GithubService.getUserProfile(accessToken!);

	if (!userSuccess) {
		res.json({
			error: true,
			message: userError,
		});
	}

	const {id, login, email} = githubUser!;

	// all good, let's find this user in our DB
	let user = await User.findOne({
		accountID: id,
		isSSO: true,
	});

	if (!user) {
		// if there is not user then create a new one
		user = User.build({
			accountID: id!,
			username: login!,
			email: email!,
			isSSO: true,
		});
		await user.save();
	}

	// generate new JWT token, so user can call protected endpoints
	const token: string = TokenHelper.generateToken(user.username);

	// build user dto and send back to the client
	res.json({
		profile: UserService.buildUserDto(user),
		token,
	});
  });

  //TODO: Verify that given JWT token is valid
  router.post('/api/auth/verify', (req: Request, res: Response) => {
	  res.sendStatus(200);
  });

  // Normal login flow with username/password
  router.post('/api/login', (req: Request, res: Response) => {
	  // todo
  });

export { router as authRouter }
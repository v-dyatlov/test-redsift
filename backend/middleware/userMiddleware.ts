import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';
import { User } from '../models/user';
import UserService from '../src/services/UserService';

const setCurrentUser = (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split(' ')[1]
  
	if (token == null) return res.sendStatus(401)
  
	jwt.verify(token, config.jwt.secret, (err: any, data) => {
	  if (err) return res.sendStatus(403);
	  User.findOne({
		username: data!.username,
	  }).then((user) => {
		  if (user) {
			  (<any>req).user = UserService.buildUserDto(user);
			  next();
		  } else {
			res.send(404).jsonp('User not found');
		  }
	  })
  
	});
};

export { setCurrentUser };
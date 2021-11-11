export const config = {
	mongo: {
		user: 'redsift',
		password: 'Vyl9r5J7IUvXxirc',
		host: 'cluster0.mdryh.mongodb.net',
		collection: 'redsift'
	},
	github: {
		url: 'https://github.com/login/oauth',
		apiUserUrl: 'https://api.github.com/user',
		callback: 'http://localhost:3001/sso/callback',
		client: '4c910389df7f155281d2',
		secret: '43be8ee0610f97aeca4d2951fe84fd82517e5afa',
	},
	jwt: {
		secret: '025e4e186c1613f1ba6a38f29d9e0ea5',
	},
};
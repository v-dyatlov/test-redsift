import { Switch } from 'react-router-dom';
import Dashboard from '../components/Dashboard/Dashboard';
import Login from '../components/Login/Login';
import SSO from '../components/SSO/sso';
import AppRoute from './AppRoute';

interface IRouteParams {
	component: React.ReactNode,
	exact?: boolean;
	isPrivate?: boolean;
}

interface IRouteDefinition {
	[path: string]: IRouteParams,
};

const RouteDefinitions: IRouteDefinition = {
	'/login': { component: Login },
	'/sso/callback': { component: SSO },
	'/dashboard': { component: Dashboard, isPrivate: true },
};

export default function Routes() {
	return (
		<Switch>
			{Object.entries(RouteDefinitions).map(
				([path, { component, exact, isPrivate }]) => (
					<AppRoute
						key={path}
						path={path}
						component={component}
						exact={exact || true}
						isPrivate={isPrivate}
					/>
				),
			)}
		</Switch>
	);
}
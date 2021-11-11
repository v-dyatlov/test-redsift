import { Route, useHistory } from 'react-router-dom';
import AuthService, {
	useIsAuthorized,
	useProfile,
} from '../services/AuthService';

/**
 * AppRoute is a type of functional HOC that wraps `Route` from `react-router-dom`
 * and enforces authorization via our `AuthService` - if user is not logged in,
 * they can't access the route if the `isPrivate` prop is true. If not a private route,
 * no auth checking is even done, just a regular Route is created.
 */
const AppRoute = (props: any) => {
	const { isPrivate, component: Component, path, ...rest } = props;
	const history = useHistory();

	// By passing isPrivate to useIsAuthorized(), we inform the AuthService that
	// it only needs to verify the authorization state when we are dealing with a private
	// route. Otherwise, for public routes, we don't need to waste time verifying auth
	// status when it doesn't matter.
	const isAuthenticated = useIsAuthorized(isPrivate);

	if (!isPrivate) {
		// Not private? Don't need our custom renderer, just create standard Route
		return <Route path={path} component={Component} {...rest} />;
	}

	const render = (props: any) => {
		if (isAuthenticated === undefined) {
			// Since this value is undefined, useIsAuthorize() will check status internally and then
			// will change isAuthenticated from `undefined` to true/false,
			// forcing re-render and falling thru to the history.push below once it's done.

			// // eslint-disable-next-line no-console
			// console.warn(
			// 	`Private route encountered at ${path} but not logged in, checking authorization status...`,
			// );

			// TODO: Could return some sort of generic loading spinner?
			return <></>;
		}

		if (!isAuthenticated) {
			// // eslint-disable-next-line no-console
			// console.warn(
			// 	`Private route encountered at ${path} but not logged in, redirecting...`,
			// );

			// Store for returning to this page upon successful login
			AuthService.storePreLoginPath(path);

			// Move out of the current stack because otherwise
			// React/react-router-dom complains about changing history during render
			requestAnimationFrame(() => history.push('/login'));

			return <></>;
		}

		return <Component {...props} />;
	};

	return <Route path={path} render={render} {...rest} />;
};

export default AppRoute;

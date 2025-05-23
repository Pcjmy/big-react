import currentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispatcher';
import { jsx, isValidElement as isValidElementFn } from './src/jsx';

export const useState: Dispatcher['useState'] = (initialState: any) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

export const useEffect: Dispatcher['useEffect'] = (create: any, deps: any) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useEffect(create, deps);
};

// 内部数据共享层
export const _SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: any = {
	currentDispatcher
};

export const version = '0.0.0';
export const createElement = jsx;
export const isValidElement = isValidElementFn;

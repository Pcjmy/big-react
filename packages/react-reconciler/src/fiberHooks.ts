import internals from 'shared/internals';
import { FiberNode } from './fiber';

let currentlyRenderingFiber: FiberNode | null = null;
let workInPropgressHook: Hook | null = null;

const { currentDispatcher } = internals;

interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

export function renderWithHooks(wip: FiberNode) {
	currentlyRenderingFiber = wip;
	wip.memoizedState = null;

	const current = wip.alternate;

	if (current !== null) {
		// update
	} else {
		// mount
	}

	const Component = wip.type;
	const props = wip.pendingProps;
	const children = Component(props);
	currentlyRenderingFiber = null;

	return children;
}

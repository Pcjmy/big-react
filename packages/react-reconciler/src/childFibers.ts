import {
	FiberNode,
	createFiberFromElement,
	createFiberFromFragment
} from './fiber';
import { Props, ReactElementType, Key } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import { HostText, Fragment } from './workTags';
import { Placement, ChildDeletion } from './fiberFlags';
import { createWorkInProgress } from './fiber';

type ExistingChildren = Map<string | number, FiberNode>;

function ChildReconciler(shouldTrackEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}
	function deleteRemainingChildren(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null
	) {
		if (!shouldTrackEffects) {
			return;
		}
		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
	}

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const key = element.key;
		while (currentFiber !== null) {
			// update
			if (currentFiber.key === key) {
				// key相同
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						let props = element.props;
						if (element.type === REACT_FRAGMENT_TYPE) {
							props = element.props.children;
						}
						// type相同
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						// 当前节点可复用，标记剩下的节点删除
						deleteRemainingChildren(returnFiber, currentFiber.sibling);
						return existing;
					}
					// key相同，type不同，删掉旧的
					deleteRemainingChildren(returnFiber, currentFiber.sibling);
					break;
				} else {
					if (__DEV__) {
						console.warn('还未实现的react类型', element);
						break;
					}
				}
			} else {
				// key不同，删掉旧的
				deleteChild(returnFiber, currentFiber);
				currentFiber = currentFiber.sibling;
			}
		}
		// 根据element创建fiber
		let fiber;
		if (element.type === REACT_FRAGMENT_TYPE) {
			fiber = createFiberFromFragment(element.props.children, key);
		} else {
			fiber = createFiberFromElement(element);
		}
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		while (currentFiber !== null) {
			if (currentFiber.tag === HostText) {
				// 类型没变可以复用
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				deleteRemainingChildren(returnFiber, currentFiber.sibling);
				return existing;
			}
			deleteChild(returnFiber, currentFiber);
			currentFiber = currentFiber.sibling;
		}
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}

	function placeSingleChild(fiber: FiberNode) {
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	function reconcileChildrenArray(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any[]
	) {
		let lastPlacedIndex: number = 0;
		let lastNewFiber: FiberNode | null = null;
		let firstNewFiber: FiberNode | null = null;
		// 1.将current保存在map中
		const existingChildren: ExistingChildren = new Map();
		let current = currentFirstChild;
		while (current !== null) {
			const keyToUse = current.key !== null ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}

		for (let i = 0; i < newChild.length; i++) {
			// 遍历newChild，寻找是否可复用
			const after = newChild[i];

			// 标记移动还是插入
			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);

			if (newFiber === null) {
				continue;
			}

			newFiber.index = i;
			newFiber.return = returnFiber;

			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				firstNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				lastNewFiber = lastNewFiber.sibling;
			}

			if (!shouldTrackEffects) {
				continue;
			}

			const current = newFiber.alternate;
			if (current !== null) {
				const oldIndex = current.index;
				if (oldIndex < lastPlacedIndex) {
					newFiber.flags |= Placement;
					continue;
				} else {
					lastPlacedIndex = oldIndex;
				}
			} else {
				newFiber.flags |= Placement;
			}
		}

		existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber);
		});

		return firstNewFiber;
	}

	function updateFromMap(
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any
	): FiberNode | null {
		const keyToUse = element.key !== null ? element.key : index;
		const before = existingChildren.get(keyToUse);

		if (typeof element === 'string' || typeof element === 'number') {
			if (before) {
				if (before.tag === HostText) {
					existingChildren.delete(keyToUse);
					return useFiber(before, { content: element + '' });
				}
			}
			return new FiberNode(HostText, { content: element + '' }, null);
		}

		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (element.type === REACT_FRAGMENT_TYPE) {
						return updateFragment(
							returnFiber,
							before,
							element.props.children,
							keyToUse,
							existingChildren
						);
					}
					if (before) {
						if (before.type === element.type) {
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}
					return createFiberFromElement(element);
			}

			if (Array.isArray(element)) {
				return updateFragment(
					returnFiber,
					before,
					element,
					keyToUse,
					existingChildren
				);
			}
		}
		return null;
	}

	return function reconcilerChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: any
	) {
		// 判断Fragment
		const isUnkeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null;

		if (isUnkeyedTopLevelFragment) {
			newChild = newChild.props.children;
		}

		// 判断当前fiber的类型
		if (typeof newChild === 'object' && newChild !== null) {
			if (Array.isArray(newChild)) {
				return reconcileChildrenArray(returnFiber, currentFiber, newChild);
			}

			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					// 原生节点
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);
				default:
					break;
			}
		}

		if (typeof newChild === 'string' || typeof newChild === 'number') {
			// 文本节点
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		if (currentFiber !== null) {
			// 兜底删除
			deleteRemainingChildren(returnFiber, currentFiber);
		}

		if (__DEV__) {
			console.warn('未实现的类型');
		}

		return null;
	};
}

function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

function updateFragment(
	returnFiber: FiberNode,
	current: FiberNode | undefined,
	element: any[],
	key: Key,
	existingChildren: ExistingChildren
) {
	let fiber;
	if (!current || current.tag !== Fragment) {
		fiber = createFiberFromFragment(element, key);
	} else {
		existingChildren.delete(key);
		fiber = useFiber(current, element);
	}
	fiber.return = returnFiber;
	return fiber;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CdkDrag} from './drag';
import {CdkDropContainer} from './drop-container';

/** Event emitted when the user starts dragging a draggable. */
export interface CdkDragStart {
  /** Draggable that emitted the event. */
  source: CdkDrag;
}


/** Event emitted when the user stops dragging a draggable. */
export interface CdkDragEnd {
  /** Draggable that emitted the event. */
  source: CdkDrag;
}

/** Event emitted when the user moves an item into a new drop container. */
export interface CdkDragEnter<T> {
  /** Container into which the user has moved the item. */
  container: CdkDropContainer<T>;
  /** Item that was removed from the container. */
  item: CdkDrag;
}

/**
 * Event emitted when the user removes an item from a
 * drop container by moving it into another one.
 */
export interface CdkDragExit<T> {
  /** Container from which the user has a removed an item. */
  container: CdkDropContainer<T>;
  /** Item that was removed from the container. */
  item: CdkDrag;
}


/** Event emitted when the user drops a draggable item inside a drop container. */
export interface CdkDragDrop<T, O = T> {
  /** Index of the item when it was picked up. */
  previousIndex: number;
  /** Current index of the item. */
  currentIndex: number;
  /** Item that is being dropped. */
  item: CdkDrag;
  /** Container in which the item was dropped. */
  container: CdkDropContainer<T>;
  /** Container from which the item was picked up. Can be the same as the `container`. */
  previousContainer: CdkDropContainer<O>;
}

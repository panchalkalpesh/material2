/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  AfterContentInit,
  Component,
  ContentChildren,
  ElementRef,
  Input,
  QueryList,
  ViewEncapsulation,
  Optional,
  Renderer2,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  forwardRef,
  Inject,
} from '@angular/core';
import {coerceBooleanProperty, SelectionModel, MdLine, MdLineSetter} from '../core';
import {FocusKeyManager} from '../core/a11y/focus-key-manager';
import {Subscription} from 'rxjs/Subscription';
import {SPACE} from '../core/keyboard/keycodes';
import {FocusableOption} from '../core/a11y/focus-key-manager';
import {CanDisable, mixinDisabled} from '../core/common-behaviors/disabled';
import {RxChain, switchMap, startWith} from '../core/rxjs/index';
import {merge} from 'rxjs/observable/merge';

export class MdSelectionListBase {}
export const _MdSelectionListMixinBase = mixinDisabled(MdSelectionListBase);


export interface MdSelectionListOptionEvent {
  option: MdListOption;
}

const FOCUSED_STYLE: string = 'mat-list-item-focus';

/**
 * Component for list-options of selection-list. Each list-option can automatically
 * generate a checkbox and can put current item into the selectionModel of selection-list
 * if the current item is checked.
 */
@Component({
  moduleId: module.id,
  selector: 'md-list-option, mat-list-option',
  host: {
    'role': 'option',
    'class': 'mat-list-item mat-list-option',
    '(focus)': '_handleFocus()',
    '(blur)': '_handleBlur()',
    '(click)': '_handleClick()',
    'tabindex': '-1',
    '[attr.aria-selected]': 'selected.toString()',
    '[attr.aria-disabled]': 'disabled.toString()',
  },
  templateUrl: 'list-option.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MdListOption implements AfterContentInit, OnDestroy, FocusableOption {
  private _lineSetter: MdLineSetter;
  private _disableRipple: boolean = false;
  private _selected: boolean = false;
  /** Whether the checkbox is disabled. */
  private _disabled: boolean = false;
  private _value: any;

  /** Whether the option has focus. */
  _hasFocus: boolean = false;

  /**
   * Whether the ripple effect on click should be disabled. This applies only to list items that are
   * part of a selection list. The value of `disableRipple` on the `md-selection-list` overrides
   * this flag
   */
  @Input()
  get disableRipple() { return this._disableRipple; }
  set disableRipple(value: boolean) { this._disableRipple = coerceBooleanProperty(value); }

  @ContentChildren(MdLine) _lines: QueryList<MdLine>;

  /** Whether the label should appear before or after the checkbox. Defaults to 'after' */
  @Input() checkboxPosition: 'before' | 'after' = 'after';

  /** Whether the option is disabled. */
  @Input()
  get disabled() { return (this.selectionList && this.selectionList.disabled) || this._disabled; }
  set disabled(value: any) { this._disabled = coerceBooleanProperty(value); }

  @Input()
  get value() { return this._value; }
  set value( val: any) { this._value = coerceBooleanProperty(val); }

  @Input()
  get selected() { return this._selected; }
  set selected( val: boolean) { this._selected = coerceBooleanProperty(val); }

  /** Emitted when the option is focused. */
  onFocus = new EventEmitter<MdSelectionListOptionEvent>();

  /** Emitted when the option is selected. */
  @Output() selectChange = new EventEmitter<MdSelectionListOptionEvent>();

  /** Emitted when the option is deselected. */
  @Output() deselected = new EventEmitter<MdSelectionListOptionEvent>();

  /** Emitted when the option is destroyed. */
  @Output() destroyed = new EventEmitter<MdSelectionListOptionEvent>();

  constructor(private _renderer: Renderer2,
              private _element: ElementRef,
              private _changeDetector: ChangeDetectorRef,
              @Optional() @Inject(forwardRef(() => MdSelectionList))
                  public selectionList: MdSelectionList) {}

  ngAfterContentInit() {
    this._lineSetter = new MdLineSetter(this._lines, this._renderer, this._element);

    if (this.selectionList.disabled) {
      this.disabled = true;
    }
  }

  ngOnDestroy(): void {
    this.destroyed.emit({option: this});
  }

  toggle(): void {
    this.selected = !this.selected;
    this.selectionList.selectedOptions.toggle(this);
    this._changeDetector.markForCheck();
  }

  /** Allows for programmatic focusing of the option. */
  focus(): void {
    this._element.nativeElement.focus();
    this.onFocus.emit({option: this});
  }

  /** Whether this list item should show a ripple effect when clicked.  */
  isRippleEnabled() {
    return !this.disableRipple && !this.selectionList.disableRipple;
  }

  _handleClick() {
    if (!this.disabled) {
      this.toggle();
    }
  }

  _handleFocus() {
    this._hasFocus = true;
    this._renderer.addClass(this._element.nativeElement, FOCUSED_STYLE);
  }

  _handleBlur() {
    this._renderer.removeClass(this._element.nativeElement, FOCUSED_STYLE);
  }

  /** Retrieves the DOM element of the component host. */
  _getHostElement(): HTMLElement {
    return this._element.nativeElement;
  }
}


@Component({
  moduleId: module.id,
  selector: 'md-selection-list, mat-selection-list',
  inputs: ['disabled'],
  host: {
    'role': 'listbox',
    '[attr.tabindex]': '_tabIndex',
    'class': 'mat-selection-list',
    '(focus)': 'focus()',
    '(keydown)': '_keydown($event)',
    '[attr.aria-disabled]': 'disabled.toString()'},
  template: '<ng-content></ng-content>',
  styleUrls: ['list.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MdSelectionList extends _MdSelectionListMixinBase
  implements FocusableOption, CanDisable, AfterContentInit, OnDestroy {
  private _disableRipple: boolean = false;

  /** Tab index for the selection-list. */
  _tabIndex = 0;

  /** Subscription to all list options' onFocus events */
  private _optionFocusSubscription: Subscription;

  /** Subscription to all list options' destroy events  */
  private _optionDestroyStream: Subscription;

  /** The FocusKeyManager which handles focus. */
  _keyManager: FocusKeyManager<MdListOption>;

  /** The option components contained within this selection-list. */
  @ContentChildren(MdListOption) options: QueryList<MdListOption>;

  /** options which are selected. */
  selectedOptions: SelectionModel<MdListOption> = new SelectionModel<MdListOption>(true);

  /**
   * Whether the ripple effect should be disabled on the list-items or not.
   * This flag only has an effect for `mat-selection-list` components.
   */
  @Input()
  get disableRipple() { return this._disableRipple; }
  set disableRipple(value: boolean) { this._disableRipple = coerceBooleanProperty(value); }

  constructor(private _element: ElementRef) {
    super();
  }

  ngAfterContentInit(): void {
    this._keyManager = new FocusKeyManager<MdListOption>(this.options).withWrap();

    if (this.disabled) {
      this._tabIndex = -1;
    }

    this._optionFocusSubscription = this._onFocusSubscription();
    this._optionDestroyStream = this._onDestroySubscription();
  }

  ngOnDestroy(): void {
    if (this._optionDestroyStream) {
      this._optionDestroyStream.unsubscribe();
    }

    if (this._optionFocusSubscription) {
      this._optionFocusSubscription.unsubscribe();
    }
  }

  focus() {
    this._element.nativeElement.focus();
  }

  /**
   * Map all the options' destroy event subscriptions and merge them into one stream.
   */
  private _onDestroySubscription(): Subscription {
    return RxChain.from(this.options.changes)
      .call(startWith, this.options)
      .call(switchMap, (options: MdListOption[]) => {
        return merge(...options.map(option => option.destroyed));
      }).subscribe((e: MdSelectionListOptionEvent) => {
        let optionIndex: number = this.options.toArray().indexOf(e.option);
        if (e.option._hasFocus) {
          // Check whether the option is the last item
          if (optionIndex < this.options.length - 1) {
            this._keyManager.setActiveItem(optionIndex);
          } else if (optionIndex - 1 >= 0) {
            this._keyManager.setActiveItem(optionIndex - 1);
          }
        }
        e.option.destroyed.unsubscribe();
      });
  }

  /**
   * Map all the options' onFocus event subscriptions and merge them into one stream.
   */
  private _onFocusSubscription(): Subscription {
    return RxChain.from(this.options.changes)
      .call(startWith, this.options)
      .call(switchMap, (options: MdListOption[]) => {
        return merge(...options.map(option => option.onFocus));
      }).subscribe((e: MdSelectionListOptionEvent) => {
      let optionIndex: number = this.options.toArray().indexOf(e.option);
      this._keyManager.updateActiveItemIndex(optionIndex);
    });
  }

  /** Passes relevant key presses to our key manager. */
  _keydown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case SPACE:
        this._toggleSelectOnFocusedOption();
        // Always prevent space from scrolling the page since the list has focus
        event.preventDefault();
        break;
      default:
        this._keyManager.onKeydown(event);
    }
  }

  /** Toggles the selected state of the currently focused option. */
  private _toggleSelectOnFocusedOption(): void {
    let focusedIndex = this._keyManager.activeItemIndex;

    if (focusedIndex != null && this._isValidIndex(focusedIndex)) {
      let focusedOption: MdListOption = this.options.toArray()[focusedIndex];

      if (focusedOption) {
        focusedOption.toggle();
      }
    }
  }

  /**
   * Utility to ensure all indexes are valid.
   *
   * @param index The index to be checked.
   * @returns True if the index is valid for our list of options.
   */
  private _isValidIndex(index: number): boolean {
    return index >= 0 && index < this.options.length;
  }
}

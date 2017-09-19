/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {PortalModule} from '@angular/cdk/portal';
import {CdkStepperModule} from '@angular/cdk/stepper';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MdButtonModule} from '@angular/material/button';
import {MdCommonModule} from '@angular/material/core';
import {MdIconModule} from '@angular/material/icon';
import {MdStepHeader} from './step-header';
import {MdStepLabel} from './step-label';
import {MdHorizontalStepper, MdStep, MdStepper, MdVerticalStepper} from './stepper';
import {MdStepperNext, MdStepperPrevious} from './stepper-button';


@NgModule({
  imports: [
    MdCommonModule,
    CommonModule,
    PortalModule,
    MdButtonModule,
    CdkStepperModule,
    MdIconModule
  ],
  exports: [
    MdCommonModule,
    MdHorizontalStepper,
    MdVerticalStepper,
    MdStep,
    MdStepLabel,
    MdStepper,
    MdStepperNext,
    MdStepperPrevious,
    MdStepHeader
  ],
  declarations: [MdHorizontalStepper, MdVerticalStepper, MdStep, MdStepLabel, MdStepper,
    MdStepperNext, MdStepperPrevious, MdStepHeader],
})
export class MdStepperModule {}

export * from './step-label';
export * from './stepper';
export * from './stepper-button';
export * from './step-header';

import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LibRoutingModule } from './lib-routing.module';

@NgModule({
  declarations: [
  ],
  imports: [
	LibRoutingModule,
	CommonModule
  ],
  exports: [],
  providers: [
  ]
})
export class LibModule {
	constructor() {} 
}

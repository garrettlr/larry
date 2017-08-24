import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { EnvironmentService } from './services/environment.service';
import { AuthModule, AccessTokenInterceptor } from '{{authProjectName}}';

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		HttpClientModule,
		AuthModule
	],
	providers: [
		EnvironmentService,
		{
			// Provider for APP_INITIALIZER
			provide: APP_INITIALIZER,
			useFactory: (environmentService: EnvironmentService) => {
				return () => environmentService.load();
			},
			deps: [EnvironmentService],
			multi: true
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AccessTokenInterceptor,
			multi: true
		}
	],
	bootstrap: [AppComponent]
})
export class AppModule { }

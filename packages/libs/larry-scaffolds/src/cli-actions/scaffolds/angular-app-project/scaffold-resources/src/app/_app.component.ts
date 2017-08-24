import { Component, OnInit, OnDestroy, enableProdMode } from '@angular/core';
import { EnvironmentService } from './services/environment.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
	title = '{{appName}}';
	constructor( private _environmentService: EnvironmentService ) {
	}
	ngOnInit() {
	}
	ngOnDestroy() {
	}
}

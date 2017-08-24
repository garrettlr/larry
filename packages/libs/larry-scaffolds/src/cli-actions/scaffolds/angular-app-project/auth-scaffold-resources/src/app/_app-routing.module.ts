import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
	// Required by AUTH Module
	{ path: 'landing', redirectTo: 'auth/landing', pathMatch: "full" }, // This is the route executed once the user is successfully logged in, this should be replaced by your own component

	// Optional Auth Routes
	{ path: '', redirectTo: 'auth/login', pathMatch: "full" },
	{ path: 'login', redirectTo: 'auth/login', pathMatch: "full" },
	{ path: 'logout', redirectTo: 'auth/logout', pathMatch: "full" }
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
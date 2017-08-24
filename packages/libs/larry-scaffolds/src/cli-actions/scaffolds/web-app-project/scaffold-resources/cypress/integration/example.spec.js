'use strict';
describe('My First Test', function() {
	it('should visit the webpage and check to see if the Heading is present', function() {
		cy.visit('http://localhost:8000');
		cy.contains('It Lives');
		cy.expect(true).to.equal(true);
	});
});
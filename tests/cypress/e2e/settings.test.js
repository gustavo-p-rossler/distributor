import { randomName } from '../support/functions';

describe( 'Test Settings', () => {
	before( () => {
		cy.login();
		cy.networkActivatePlugin( 'distributor' );
		cy.networkActivatePlugin( 'json-basic-authentication' );

		// Author byline seting doesn't work in some themes
		// Switching to Twenty-Twenty-One which works correctly
		// https://github.com/10up/distributor/issues/868#issuecomment-1254655118
		cy.networkEnableTheme( 'twentytwentyone' );
		cy.visit( '/second/wp-admin/themes.php' );
		cy.get( 'body' ).then( ( $body ) => {
			if (
				$body.find(
					'.theme[data-slug="twentytwentyone"] .button.activate'
				).length > 0
			) {
				cy.get(
					'.theme[data-slug="twentytwentyone"] .button.activate'
				).click();
			}
		} );
	} );

	it( 'Should Save Settings', () => {
		cy.visit( 'wp-admin/admin.php?page=distributor-settings' );

		// Round one.
		cy.get( '.form-table input[type="checkbox"]' ).first().check();
		cy.get( 'input[type="radio"]' ).check( 'featured' );

		cy.get( '#submit' ).click();

		cy.get( '.form-table input[type="checkbox"]' )
			.first()
			.should( 'be.checked' );

		cy.get( 'input[type="radio"]:checked' )
			.should( 'be.checked' )
			.and( 'have.value', 'featured' );

		// Round two.
		cy.get( '.form-table input[type="checkbox"]' ).first().uncheck();
		cy.get( 'input[type="radio"]' ).check( 'attached' );
		cy.get( '#submit' ).click();

		cy.get( '.form-table input[type="checkbox"]' )
			.first()
			.should( 'not.be.checked' );

		cy.get( 'input[type="radio"]:checked' )
			.should( 'be.checked' )
			.and( 'have.value', 'attached' );
	} );

	it( 'Author byline', () => {
		// Create external connection if not yet
		const connectionName = 'Author byline connection';
		cy.createExternalConnection(
			connectionName,
			'http://localhost/second/wp-json'
		);

		cy.createPost( { title: 'Byline test ' + randomName() } ).then(
			( post ) => {
				cy.distributorPushPost( post.id, connectionName ).then(
					( postInfo ) => {
						// Enable byline setting.
						cy.visit(
							'second/wp-admin/admin.php?page=distributor-settings'
						);
						cy.get(
							'input[type="checkbox"][name="dt_settings[override_author_byline]"]'
						).check();
						cy.get( '#submit' ).click();

						cy.visit( postInfo.distributedFrontUrl );
						cy.get( '.byline a' ).contains( 'distributor' );

						// Disable byline setting.
						cy.visit(
							'second/wp-admin/admin.php?page=distributor-settings'
						);
						cy.get(
							'input[type="checkbox"][name="dt_settings[override_author_byline]"]'
						).uncheck();
						cy.get( '#submit' ).click();

						cy.visit( postInfo.distributedFrontUrl );
						cy.get( '.byline a' ).contains( 'admin' );
					}
				);
			}
		);
	} );
} );

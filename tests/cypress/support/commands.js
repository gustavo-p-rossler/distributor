// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
Cypress.Commands.add( 'networkActivatePlugin', ( slug ) => {
	cy.visit( '/wp-admin/network/plugins.php' );
	cy.get( `#the-list tr[data-slug="${ slug }"]` ).then( ( $pluginRow ) => {
		if ( $pluginRow.find( '.activate > a' ).length > 0 ) {
			cy.get( `#the-list tr[data-slug="${ slug }"] .activate > a` )
				.should( 'have.text', 'Network Activate' )
				.click();
		}
	} );
} );

Cypress.Commands.add( 'networkEnableTheme', ( slug ) => {
	cy.visit( '/wp-admin/network/themes.php' );
	cy.get( `#the-list tr[data-slug="${ slug }"]` ).then( ( $themeRow ) => {
		if ( $themeRow.find( '.enable > a' ).length > 0 ) {
			cy.get( `#the-list tr[data-slug="${ slug }"] .enable > a` )
				.should( 'have.text', 'Network Enable' )
				.click();
		}
	} );
} );

Cypress.Commands.add( 'disableFullscreenEditor', () => {
	cy.window().then( ( win ) => {
		if (
			!! win.wp.data &&
			win.wp.data
				.select( 'core/edit-post' )
				.isFeatureActive( 'fullscreenMode' )
		) {
			win.wp.data
				.dispatch( 'core/edit-post' )
				.toggleFeature( 'fullscreenMode' );
		}
	} );
} );

Cypress.Commands.add( 'dismissNUXTip', () => {
	cy.get( 'body' ).then( ( $body ) => {
		if ( $body.find( '.nux-dot-tip__disable' ).length ) {
			cy.get( '.nux-dot-tip__disable' ).click();
		}
	} );
} );

Cypress.Commands.add(
	'createExternalConnection',
	( name = 'Test Connection', url = 'http://localhost/wp-json', user = 'admin', password = 'password' ) => {
		cy.visit( '/wp-admin/admin.php?page=distributor' );

		cy.get( '.row-title, .no-items' ).then( ( elements ) => {
			const noItems = elements.hasClass( 'no-items' );
			const found = elements.toArray().reduce( ( prev, el ) => {
				if ( el.textContent === name ) {
					prev = true;
				}
				return prev;
			}, false );
			if ( noItems || ! found ) {
				cy.visit( '/wp-admin/post-new.php?post_type=dt_ext_connection' );

				cy.get( '.manual-setup-button' ).click();

				cy.get( '#title' ).type( name );

				cy.get( '#dt_username' ).type( user );

				cy.get( '#dt_password' ).type( password );

				cy.get( '#dt_external_connection_url' ).type( url );

				cy.get( '#create-connection' ).click();
			}

			// Visit the list and check the validation.
			cy.visit( '/wp-admin/admin.php?page=distributor' );
			cy.get( '.row-title' )
				.contains( name )
				.closest( 'tr' )
				.find( '.connection-status' )
				.should( 'have.class', 'valid' );
		} );
	}
);

Cypress.Commands.add(
	'distributorPushPost',
	(
		postId,
		toConnectionName,
		fromBlogSlug = '',
		postStatus = 'publish',
		external = false
	) => {
		const info = {
			originalEditUrl:
				fromBlogSlug +
				'/wp-admin/post.php?post=' +
				postId +
				'&action=edit',
		};

		cy.visit( info.originalEditUrl );

		cy.get( 'body' ).then( ( $body ) => {
			let originalFrontUrl;
			if ( $body.find( '#wp-admin-bar-view a' ).length ) {
				originalFrontUrl = $body
					.find( '#wp-admin-bar-view a' )
					.first()
					.prop( 'href' );
			} else {
				originalFrontUrl = $body
					.find( '#wp-admin-bar-preview a' )
					.first()
					.prop( 'href' );
			}
			info.originalFrontUrl = originalFrontUrl;
		} );

		cy.disableFullscreenEditor();
		cy.dismissNUXTip();
		cy.closeWelcomeGuide();

		cy.get( '#wp-admin-bar-distributor' )
			.contains( 'Distributor' )
			.should( 'be.visible' )
			.click();

		cy.get( '#distributor-push-wrapper .new-connections-list' ).should(
			'be.visible'
		);

		// Distribute post
		cy.get(
			'#distributor-push-wrapper .new-connections-list .add-connection'
		)
			.contains( toConnectionName )
			.click();

		if ( 'publish' === postStatus ) {
			// Uncheck for publish, draft is checked by default.
			cy.get( '#dt-as-draft' ).click();
		}

		cy.get( '#distributor-push-wrapper .syndicate-button' ).click();

		cy.get( '#distributor-push-wrapper .dt-success' ).should( 'be.visible' );

		// Now let's navigate to the new post - only works for network connections.
		if ( ! external ) {
			cy.get(
				'#distributor-push-wrapper .new-connections-list .add-connection'
			)
				.contains( toConnectionName )
				.closest( '.add-connection' )
				.find( 'a' )
				.contains( 'View' )
				.click();

			cy.get( '#wp-admin-bar-edit a' )
				.invoke( 'attr', 'href' )
				.then( ( href ) => {
					info.distributedEditUrl = href;
					const matches = href.match( /post=(\d+)/ );
					if ( matches ) {
						info.distributedPostId = matches[ 1 ];
					}
				} );

			cy.url().then( ( url ) => {
				info.distributedFrontUrl = url;
			} );
		}

		cy.wrap( info );
	}
);

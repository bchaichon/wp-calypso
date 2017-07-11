/**
 * External dependencies
 */
import sinon from 'sinon';
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import {
	KEYRING_SERVICES_RECEIVE,
	KEYRING_SERVICES_REQUEST,
	KEYRING_SERVICES_REQUEST_FAILURE,
	KEYRING_SERVICES_REQUEST_SUCCESS,
} from 'state/action-types';
import { requestKeyringServices } from '../actions';
import useNock from 'test/helpers/use-nock';
import { useSandbox } from 'test/helpers/use-sinon';

describe( 'actions', () => {
	let spy;
	useSandbox( sandbox => ( spy = sandbox.spy() ) );

	describe( 'requestKeyringServices()', () => {
		describe( 'successful requests', () => {
			useNock( nock => {
				nock( 'https://public-api.wordpress.com:443' )
					.persist()
					.get( '/rest/v1.1/meta/external-services/' )
					.reply( 200, {
						services: {
							facebook: { ID: 'facebook' },
							twitter: { ID: 'twitter' },
						},
					} );
			} );

			it( 'should dispatch fetch action when thunk triggered', () => {
				requestKeyringServices()( spy );

				expect( spy ).to.have.been.calledWith( {
					type: KEYRING_SERVICES_REQUEST,
				} );
			} );

			it( 'should dispatch keyring services receive action when request completes', () => {
				return requestKeyringServices()( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: KEYRING_SERVICES_RECEIVE,
						services: {
							facebook: { ID: 'facebook' },
							twitter: { ID: 'twitter' },
						},
					} );
				} );
			} );

			it( 'should dispatch keyring services request success action when request completes', () => {
				return requestKeyringServices()( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: KEYRING_SERVICES_REQUEST_SUCCESS,
					} );
				} );
			} );
		} );

		describe( 'failing requests', () => {
			useNock( nock => {
				nock( 'https://public-api.wordpress.com:443' )
					.persist()
					.get( '/rest/v1.1/meta/external-services/' )
					.reply( 500, {
						error: 'server_error',
						message: 'A server error occurred',
					} );
			} );

			it( 'should dispatch fetch action when thunk triggered', () => {
				requestKeyringServices()( spy );

				expect( spy ).to.have.been.calledWith( {
					type: KEYRING_SERVICES_REQUEST,
				} );
			} );

			it( 'should dispatch keyring services request fail action when request fails', () => {
				return requestKeyringServices()( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( {
						type: KEYRING_SERVICES_REQUEST_FAILURE,
						error: sinon.match( { message: 'A server error occurred' } ),
					} );
				} );
			} );
		} );
	} );
} );

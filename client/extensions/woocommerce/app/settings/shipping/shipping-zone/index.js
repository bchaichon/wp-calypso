/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { localize } from 'i18n-calypso';
import page from 'page';

/**
 * Internal dependencies
 */
import Main from 'components/main';
import QueryShippingZones, { areShippingZonesFullyLoaded } from 'woocommerce/components/query-shipping-zones';
import ShippingZoneHeader from './shipping-zone-header';
import ShippingZoneLocationList from './shipping-zone-location-list';
import ShippingZoneMethodList from './shipping-zone-method-list';
import ShippingZoneName, { getZoneName } from './shipping-zone-name';
import {
	addNewShippingZone,
	openShippingZoneForEdit,
	createShippingZoneSaveActionList,
	createShippingZoneDeleteActionList,
} from 'woocommerce/state/ui/shipping/zones/actions';
import { changeShippingZoneName } from 'woocommerce/state/ui/shipping/zones/actions';
import { getCurrentlyEditingShippingZone } from 'woocommerce/state/ui/shipping/zones/selectors';
import { getCurrentlyEditingShippingZoneLocationsList } from 'woocommerce/state/ui/shipping/zones/locations/selectors';
import { getSelectedSite, getSelectedSiteId } from 'state/ui/selectors';
import { successNotice, errorNotice } from 'state/notices/actions';
import { getLink } from 'woocommerce/lib/nav-utils';
import { ProtectFormGuard } from 'lib/protect-form';
import { getSaveZoneActionListSteps } from 'woocommerce/state/data-layer/ui/shipping-zones';

class Shipping extends Component {
	constructor() {
		super();
		this.onSave = this.onSave.bind( this );
		this.onDelete = this.onDelete.bind( this );
	}

	componentWillMount() {
		const { params, siteId, loaded, actions } = this.props;

		if ( loaded ) {
			if ( isNaN( params.zone ) ) {
				actions.addNewShippingZone( siteId );
			} else {
				actions.openShippingZoneForEdit( siteId, Number( params.zone ) );
			}
		}
	}

	componentWillReceiveProps( { loaded, siteId, zone, site } ) {
		const { params, actions } = this.props;

		//zones loaded, either open one for edit or add new
		if ( ! this.props.loaded && loaded ) {
			if ( isNaN( params.zone ) ) {
				actions.addNewShippingZone( siteId );
			} else {
				actions.openShippingZoneForEdit( siteId, Number( params.zone ) );
			}
		}

		// If the zone currently being edited vanished, then go back
		if ( this.props.zone && ! zone ) {
			page.redirect( getLink( '/store/settings/shipping/:site', site ) );
		}

		// If the zone didn't have a real ID before but it does now, change the URL from /zone/new to /zone/ID
		if ( this.props.zone && isNaN( this.props.zone.id ) && zone && ! isNaN( zone.id ) ) {
			page.replace( getLink( '/store/settings/shipping/zone/:site/' + zone.id, site ), null, false, false );
		}
	}

	onSave() {
		const { siteId, zone, locations, translate, actions } = this.props;

		if ( ! zone.name ) {
			actions.changeShippingZoneName( siteId, getZoneName( zone, locations, translate ) );
		}

		const successAction = successNotice(
			isNaN( zone.id ) ? translate( 'Shipping Zone added.' ) : translate( 'Shipping Zone saved.' ),
			{ duration: 4000 }
		);

		const failureAction = errorNotice(
			translate( 'There was a problem saving the Shipping Zone. Please try again.' )
		);

		const locationsFailAction = errorNotice(
			translate( 'Add at least one location to this zone' ),
			{ duration: 4000 }
		);

		const methodsFailAction = errorNotice(
			translate( 'Add shipping methods to this zone' ),
			{ duration: 4000 }
		);

		actions.createShippingZoneSaveActionList( successAction, failureAction, locationsFailAction, methodsFailAction );
	}

	onDelete() {
		const { translate, actions } = this.props;

		const successAction = successNotice(
			translate( 'Shipping Zone deleted.' ),
			{ duration: 4000, displayOnNextPage: true }
		);

		const failureAction = errorNotice(
			translate( 'There was a problem deleting the Shipping Zone. Please try again.' )
		);

		actions.createShippingZoneDeleteActionList( successAction, failureAction );
	}

	render() {
		const { siteId, className, loaded, zone, locations, isRestOfTheWorld, hasEdits } = this.props;

		return (
			<Main className={ classNames( 'shipping', className ) }>
				<ProtectFormGuard isChanged={ hasEdits } />
				<QueryShippingZones siteId={ siteId } />
				<ShippingZoneHeader
					onSave={ this.onSave }
					onDelete={ this.onDelete } />
				{ isRestOfTheWorld
					? null
					: <ShippingZoneLocationList siteId={ siteId } loaded={ loaded } /> }
				<ShippingZoneMethodList
					siteId={ siteId }
					loaded={ loaded } />
				{ isRestOfTheWorld
					? null
					: <ShippingZoneName
						siteId={ siteId }
						loaded={ loaded }
						zone={ zone }
						locations={ locations } />
				}
			</Main>
		);
	}
}

Shipping.propTypes = {
	className: PropTypes.string,
	params: PropTypes.object,
};

export default connect(
	( state ) => {
		const loaded = areShippingZonesFullyLoaded( state );
		const zone = loaded && getCurrentlyEditingShippingZone( state );
		const isRestOfTheWorld = zone && 0 === zone.id;

		return {
			siteId: getSelectedSiteId( state ),
			site: getSelectedSite( state ),
			loaded,
			zone,
			isRestOfTheWorld,
			locations: loaded && getCurrentlyEditingShippingZoneLocationsList( state, 20 ),
			hasEdits: zone && 0 !== getSaveZoneActionListSteps( state ).length,
		};
	},
	( dispatch ) => ( {
		actions: bindActionCreators(
			{
				addNewShippingZone,
				openShippingZoneForEdit,
				changeShippingZoneName,
				createShippingZoneSaveActionList,
				createShippingZoneDeleteActionList,
			}, dispatch
		)
	} ) )( localize( Shipping ) );

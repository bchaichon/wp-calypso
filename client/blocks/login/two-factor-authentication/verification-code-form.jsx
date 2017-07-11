/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import FormButton from 'components/forms/form-button';
import FormTextInput from 'components/forms/form-text-input';
import FormFieldset from 'components/forms/form-fieldset';
import FormLabel from 'components/forms/form-label';
import FormInputValidation from 'components/forms/form-input-validation';
import Card from 'components/card';
import { localize } from 'i18n-calypso';
import { loginUserWithTwoFactorVerificationCode } from 'state/login/actions';
import { getTwoFactorAuthRequestError } from 'state/login/selectors';
import { recordTracksEvent } from 'state/analytics/actions';
import { sendSmsCode } from 'state/login/actions';
import TwoFactorActions from './two-factor-actions';

class VerificationCodeForm extends Component {
	static propTypes = {
		loginUserWithTwoFactorVerificationCode: PropTypes.func.isRequired,
		onSuccess: PropTypes.func.isRequired,
		recordTracksEvent: PropTypes.func.isRequired,
		sendSmsCode: PropTypes.func.isRequired,
		translate: PropTypes.func.isRequired,
		twoFactorAuthRequestError: PropTypes.object,
		twoFactorAuthType: PropTypes.string.isRequired,
	};

	state = {
		twoStepCode: '',
		isDisabled: true,
	};

	componentDidMount() {
		this.setState( { isDisabled: false } ); // eslint-disable-line react/no-did-mount-set-state
	}

	componentWillReceiveProps = nextProps => {
		const hasError = this.props.twoFactorAuthRequestError !== nextProps.twoFactorAuthRequestError;
		const isNewPage = this.props.twoFactorAuthType !== nextProps.twoFactorAuthType;

		if ( isNewPage ) {
			// Resets the code input value when changing pages
			this.setState( { twoStepCode: '' } );
		}

		if ( ( isNewPage || hasError ) && this.input !== null ) {
			this.input.focus();
		}
	};

	onChangeField = event => {
		this.setState( {
			[ event.target.name ]: event.target.value,
		} );
	};

	onSubmitForm = event => {
		event.preventDefault();

		const { onSuccess, twoFactorAuthType } = this.props;
		const { twoStepCode } = this.state;

		this.props.recordTracksEvent( 'calypso_login_two_factor_verification_code_submit' );

		this.setState( { isDisabled: true } );

		this.props
			.loginUserWithTwoFactorVerificationCode( twoStepCode, twoFactorAuthType )
			.then( () => {
				this.props.recordTracksEvent( 'calypso_login_two_factor_verification_code_success' );

				onSuccess();
			} )
			.catch( error => {
				this.setState( { isDisabled: false } );
				this.props.recordTracksEvent( 'calypso_login_two_factor_verification_code_failure', {
					error_code: error.code,
					error_message: error.message,
				} );
			} );
	};

	saveRef = input => {
		this.input = input;
	};

	render() {
		const { translate, twoFactorAuthRequestError: requestError, twoFactorAuthType } = this.props;

		let helpText = translate(
			'Enter the code generated by your Authenticator mobile application.',
		);
		let labelText = translate( 'Verification code' );
		let smallPrint;

		if ( twoFactorAuthType === 'sms' ) {
			helpText = translate( 'Enter the code from the text message we sent you.' );
		}

		if ( twoFactorAuthType === 'backup' ) {
			helpText = translate(
				"If you can't access your phone enter one of the 10 backup codes that were provided " +
					'when you set up two-step authentication to continue.',
			);
			labelText = translate( 'Backup code' );
			smallPrint = (
				<div className="two-factor-authentication__small-print">
					{ translate(
						'If you lose your device, accidentally remove the authenticator app, or are otherwise ' +
							'locked out of your account, the only way to get back in to your account is by using a backup code.',
					) }
				</div>
			);
		}

		return (
			<form onSubmit={ this.onSubmitForm }>
				<Card className="two-factor-authentication__push-notification-screen is-compact">
					<p>
						{ helpText }
					</p>

					<FormFieldset>
						<FormLabel htmlFor="twoStepCode">
							{ labelText }
						</FormLabel>

						<FormTextInput
							autoComplete="off"
							autoFocus
							value={ this.state.twoStepCode }
							onChange={ this.onChangeField }
							className={ classNames( {
								'is-error': requestError && requestError.field === 'twoStepCode',
							} ) }
							name="twoStepCode"
							pattern="[0-9]*"
							ref={ this.saveRef }
							disabled={ this.state.isDisabled }
							type="tel"
						/>

						{ requestError &&
							requestError.field === 'twoStepCode' &&
							<FormInputValidation isError text={ requestError.message } /> }
					</FormFieldset>

					<FormButton
						className="two-factor-authentication__form-button"
						primary
						disabled={ this.state.isDisabled }
					>
						{ translate( 'Continue' ) }
					</FormButton>

					{ smallPrint }
				</Card>

				<TwoFactorActions twoFactorAuthType={ twoFactorAuthType } />
			</form>
		);
	}
}

export default connect(
	state => ( {
		twoFactorAuthRequestError: getTwoFactorAuthRequestError( state ),
	} ),
	{
		loginUserWithTwoFactorVerificationCode,
		recordTracksEvent,
		sendSmsCode,
	},
)( localize( VerificationCodeForm ) );

const AuthorizationError = require( './authorization-error' );

class BadSchemeError extends AuthorizationError {

    constructor( exactMessage ) {

        super( 'BAD_SCHEME_ERROR', 'The provided scheme is invalid.', { exactMessage } );
        this.name = 'BadSchemeError';

    }

}

module.exports = BadSchemeError;

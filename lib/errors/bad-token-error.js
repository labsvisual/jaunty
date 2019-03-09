const AuthorizationError = require( './authorization-error' );

class BadTokenError extends AuthorizationError {

    constructor() {

        super( 'BAD_TOKEN_ERROR', 'The provided token is invalid.' );

    }

}

module.exports = BadTokenError;

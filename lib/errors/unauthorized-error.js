const AuthorizationError = require( './authorization-error' );

class UnauthorizedError extends AuthorizationError {

    constructor() {

        super(
            'UNAUTHORIZED_ERROR', 'The current user does not have access to the requested resource.'
        );

    }

}

module.exports = UnauthorizedError;

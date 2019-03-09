class AuthorizationError extends Error {

    constructor( type, message, additionalArgs ) {

        super( JSON.stringify( {
            type,
            message,
            ...additionalArgs
        } ) );

    }

}

module.exports = AuthorizationError;

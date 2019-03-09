const jwt = require( 'jsonwebtoken' );

const Utils = require( './utils' );
const Errors = require( './errors' );

/**
 * Creates a new instance of the Jaunty JWT middleware.
 *
 * @param {object} opts - the options to use for configuring the instance
 * @param {string} opts.signingSecret - the secret which was used to sign the JWT
 * @param {Set<string>} [opts.ignoreAuthentication] - contains a set of routes which are ignored by the middleware
 * @param {object} [opts.attachments] - specifies where, if any, Jaunty should deserialize the user
 * @param {string} [opts.attachments.request=user]  - specifies the name of the property on the request object
 *  where the deserilized user data resides
 *
 * @returns {function} a middleware function
 */
module.exports.createInstance = function createInstance( opts ) {

    opts = Utils.normalizeOptions( opts );

    if ( opts.validate ) {

        if ( opts.validate.length === 2 ) {

            opts.validate = Utils.wrapCallbackInPromise( opts.validate );

        }

    } else {

        opts.validate = Utils.NOOP;

    }

    const verifyJwt = Utils.wrapCallbackInPromise( jwt.verify );

    return async function jauntyMiddleware( request, _, next ) {

        if ( request.method.toLowerCase() === 'options' ||
            ( opts.ignoreAuthentication && opts.ignoreAuthentication.has( request.originalUrl ) ) ) {

            return next();

        }

        let token;
        let decodedToken;

        if ( request.headers && request.headers.authorization ) {

            const [ scheme, jwtToken ] = request.headers.authorization.split( ' ' );
            if ( !scheme || !jwtToken || scheme.toLowerCase() !== 'bearer' ) {

                return opts.authorizationRequired ?
                    next( new Errors.BadSchemeError() ) :
                    next();

            }

            token = jwtToken;

        } else {

            return opts.authorizationRequired ?
                next(
                    new Errors.BadSchemeError()
                ) : next();

        }

        try {

            /*
             * Decode the token first because this operation is cheap and if the
             * token is invalid (encoding-wise), we can reject it here.
             */
            decodedToken = jwt.decode( token, { complete: true } );

        } catch ( error ) {

            /* istanbul ignore next */
            return next(
                new Errors.BadTokenError()
            );

        }

        // https://github.com/brianloveswords/node-jws/blob/master/lib/verify-stream.js#L62
        // https://github.com/auth0/node-jsonwebtoken/blob/master/decode.js#L6
        if ( !decodedToken ) {

            return next(
                new Errors.BadTokenError()
            );

        }

        try {

            await verifyJwt( token, opts.signingSecret );

        } catch ( error ) {

            return next(
                new Errors.UnauthorizedError()
            );

        }

        try {

            const resolution = await opts.validate( decodedToken );

            if ( typeof resolution !== 'object' ) {

                return next(
                    new TypeError(
                        'Expected the "options.validate" method to return an Object. ' +
                        `Got "${ typeof resolution }".`
                    )
                );

            }

            if ( resolution.isValid ) {

                request[ opts.attachments.request ] = ( resolution.__NOOP__ ) ? {
                    isNoop: true,
                    ...decodedToken
                } : resolution.payload;

                return next();

            }

            return next(
                new Errors.UnauthorizedError()
            );

        } catch ( error ) {

            return next( error );

        }

    };

};

module.exports.Errors = Errors;

exports.normalizeOptions = opts => {

    const optsType = typeof opts;
    const defaults = {
        attachments: {
            request: 'user'
        },
        ignoreAuthentication: new Set()
    };

    if ( optsType === 'undefined' || opts === null ) {

        throw new TypeError( 'The "options" argument is required.' );

    }

    if ( ( optsType !== 'object' || Array.isArray( opts ) ) && optsType !== 'string' ) {

        throw new TypeError(
            'Was expecting "options" to be of type "String" or "Object". ' +
            `Got "${ optsType }".`
        );

    }

    if ( typeof opts !== 'string' && typeof opts.signingSecret !== 'string' ) {

        throw new TypeError(
            'Was expecting a "signingSecret" property of type "String" in options. ' +
            `Got "${ typeof opts.signingSecret }".`
        );

    }

    if ( typeof opts.validate !== 'undefined' && typeof opts.validate !== 'function' ) {

        throw new TypeError(
            'Was expecting a "validate" property of type "function" in options. ' +
            `Got "${ typeof opts.validate }".`
        );

    }

    let tempOpts = {};

    if ( typeof opts === 'string' ) {

        tempOpts.signingSecret = opts;

    } else {

        tempOpts = opts;

    }

    return Object.assign( {}, defaults, tempOpts );

};

exports.NOOP = function NOOP( { payload } ) {

    return Promise.resolve( { isValid: true, __NOOP__: true, payload } );

};

exports.wrapCallbackInPromise = function wrapCallbackInPromise( fn ) {

    return function callbackWrapper( ...args ) {

        return new Promise( ( resolve, reject ) => {

            fn( ...args, ( err, data ) => {

                if ( err ) {

                    reject( err );

                } else {

                    resolve( data );

                }

            } );

        } );

    };

};

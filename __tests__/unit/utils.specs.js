const test = require( 'tape' );

const Utils = require( '../../lib/utils' );

test( '#NormalizeOptions > throws an error when invalid options are provided', t => {

    t.throws( Utils.normalizeOptions, TypeError, 'throw an error for opts = undef' );
    t.throws(
        () => Utils.normalizeOptions( null ),
        TypeError,
        'throw an error for opts = null'
    );
    t.throws(
        () => Utils.normalizeOptions( false ),
        TypeError,
        'throw an error for opts != string or object'
    );
    t.throws(
        () => Utils.normalizeOptions( [] ),
        TypeError,
        'throw an error for opts != string or object'
    );
    t.throws(
        () => Utils.normalizeOptions( 12 ),
        TypeError,
        'throw an error for opts != string or object'
    );
    t.throws(
        () => Utils.normalizeOptions( {} ),
        TypeError,
        'throw an error opts does not have "signingSecret"'
    );
    t.throws(
        () => Utils.normalizeOptions( { signingSecret: null } ),
        TypeError,
        'throw an error opts.signingSecret != string'
    );
    t.throws(
        () => Utils.normalizeOptions( { signingSecret: 'hello', validate: false } ),
        TypeError,
        'throw an error opts.validate != function'
    );

    t.end();

} );

test( '#NormalizeOptions > correctly normalizes the options', t => {

    const expectation = {
        signingSecret: 'abc',
        attachments: {
            request: 'user'
        },
        authorizationRequired: true
    };

    t.deepEqual( Utils.normalizeOptions( 'abc' ), expectation,
        'when just a string is provided, a correctly formatted object is returned' );

    t.deepEqual( Utils.normalizeOptions( { signingSecret: 'abc' } ), expectation,
        'when just an object is provided, a correctly formatted object is returned' );

    t.end();

} );

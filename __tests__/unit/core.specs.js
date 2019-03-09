const test = require( 'tape' );
const sinon = require( 'sinon' );

const Jaunty = require( '../../lib' );

const GOOD_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.' +
    'eyJhdWQiOiJbJ3VzZXInXSIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.' +
    'ddfH747lrO-gb5QtQADZyCVPvFcAd1FTRUwaWhe7wrI';
const SIGNING_SECRET = 'test';

const jaunty = Jaunty.createInstance( {
    signingSecret: SIGNING_SECRET
} );

test( '#Core > When method is OPTIONS, it does nothing', t => {

    const request = { method: 'OPTIONS' };
    const next = sinon.spy();

    jaunty( request, null, next );

    t.ok( next.calledOnce, 'the next function is called' );
    t.ok( next.args.length, 'the next function is not called with any arguments' );
    t.end();

} );

test( '#Core > If a URL exists in the ignoreAuth set, it does nothing', t => {

    const customJaunty = Jaunty.createInstance( {
        signingSecret: SIGNING_SECRET,
        ignoreAuthentication: new Set().add( '/open' )
    } );

    const request = { method: 'GET', originalUrl: '/open' };
    const next = sinon.spy();

    customJaunty( request, null, next );

    t.ok( next.calledOnce, 'the next function is called' );
    t.ok( next.args.length, 'the next function is not called with any arguments' );
    t.end();

} );

test( '#Core > When no headers are provided, throws an error', t => {

    let request = { method: 'POST' };
    const next = sinon.spy();

    jaunty( request, null, next );

    request = { method: 'POST', headers: {} };
    jaunty( request, null, next );

    t.ok(
        next.getCall( 0 ).args[ 0 ] instanceof Jaunty.Errors.BadSchemeError,
        'throws the correct error when no headers are provided'
    );

    t.ok(
        next.getCall( 1 ).args[ 0 ] instanceof Jaunty.Errors.BadSchemeError,
        'throws the correct error when no authorization header is provided'
    );

    t.end();

} );

test( '#Core > When no headers are provided but authorizationRequired = false no errors', t => {

    let request = { method: 'POST' };
    const next = sinon.spy();

    const customJaunty = Jaunty.createInstance( {
        signingSecret: SIGNING_SECRET,
        authorizationRequired: false
    } );

    customJaunty( request, null, next );

    request = { method: 'POST', headers: {} };
    customJaunty( request, null, next );

    t.notOk( next.getCall( 0 ).args[ 0 ], 'does not throw an error' );
    t.notOk( next.getCall( 1 ).args[ 0 ], 'does not throw an error' );

    t.end();

} );

test( '#Core > Throws an error when incorrect scheme is provided', t => {

    let request = { method: 'POST', headers: { authorization: '' } };
    const next = sinon.spy();

    jaunty( request, null, next );

    request = { method: 'POST', headers: { authorization: 'Something ' } };
    jaunty( request, null, next );

    request = { method: 'POST', headers: { authorization: 'Bread something' } };
    jaunty( request, null, next );

    t.ok(
        next.getCall( 0 ).args[ 0 ] instanceof Jaunty.Errors.BadSchemeError,
        'throws the correct error when no auth header content is provided'
    );

    t.ok(
        next.getCall( 1 ).args[ 0 ] instanceof Jaunty.Errors.BadSchemeError,
        'throws the correct error when no auth token is provided'
    );

    t.ok(
        next.getCall( 2 ).args[ 0 ] instanceof Jaunty.Errors.BadSchemeError,
        'throws the correct error when no incorrect scheme is used'
    );

    t.end();

} );

test( '#Core > Does not throw an error when authorizationRequired is false', t => {

    const customJaunty = Jaunty.createInstance( {
        signingSecret: SIGNING_SECRET,
        authorizationRequired: false
    } );

    let request = { method: 'POST', headers: { authorization: '' } };
    const next = sinon.spy();

    customJaunty( request, null, next );

    request = { method: 'POST', headers: { authorization: 'Something ' } };
    customJaunty( request, null, next );

    request = { method: 'POST', headers: { authorization: 'Bread something' } };
    customJaunty( request, null, next );

    t.notOk( next.getCall( 0 ).args[ 0 ], 'does not throw an error' );
    t.notOk( next.getCall( 1 ).args[ 0 ], 'does not throw an error' );
    t.notOk( next.getCall( 2 ).args[ 0 ], 'does not throw an error' );

    t.end();

} );

test( '#Core > Throws an error when invalid token is provided', t => {

    const request = { method: 'POST', headers: { authorization: 'Bearer abcde.egd.ega' } };
    const next = sinon.spy();

    jaunty( request, null, next );

    t.ok(
        next.getCall( 0 ).args[ 0 ] instanceof Jaunty.Errors.BadTokenError,
        'throws the correct type of error'
    );

    t.end();

} );

test( '#Core > If validate method is provided as a callback, it wraps it in a promise', async t => {

    t.plan( 2 );

    const customJaunty = Jaunty.createInstance( {
        signingSecret: SIGNING_SECRET,
        validate( _, cb ) {

            cb( new TypeError( 'example error' ) );

        }
    } );

    const request = { method: 'POST', headers: { authorization: 'Bearer ' + GOOD_TOKEN } };
    const next = sinon.spy();

    try {

        await customJaunty( request, null, next );

        t.ok(
            next.getCall( 0 ).args[ 0 ] instanceof TypeError,
            'throws the correct type of error'
        );

        t.equal(
            next.getCall( 0 ).args[ 0 ].message,
            'example error',
            'make sure this is the error we planted'
        );

    } catch ( error ) {}

} );

test( '#Core > If validate method returns a promise, the library recognizes that', async t => {

    t.plan( 2 );

    const customJaunty = Jaunty.createInstance( {
        signingSecret: SIGNING_SECRET,
        validate( _ ) {

            return Promise.reject(
                new TypeError( 'example error' )
            );

        }
    } );

    const request = { method: 'POST', headers: { authorization: 'Bearer ' + GOOD_TOKEN } };
    const next = sinon.spy();

    try {

        await customJaunty( request, null, next );

        t.ok(
            next.getCall( 0 ).args[ 0 ] instanceof TypeError,
            'throws the correct type of error'
        );

        t.equal(
            next.getCall( 0 ).args[ 0 ].message,
            'example error',
            'make sure this is the error we planted'
        );

    } catch ( error ) {}

} );

test( '#Core > When no validate method is provided, it uses NOOP', async t => {

    t.plan( 1 );

    const request = { method: 'POST', headers: { authorization: 'Bearer ' + GOOD_TOKEN } };
    const next = sinon.spy();

    try {

        await jaunty( request, null, next );

        t.ok( request.user.isNoop, 'the "isNoop" flag is true' );

    } catch ( error ) {}

} );

test( '#Core > Throw an error if validate resolution is not an object', async t => {

    t.plan( 1 );

    const customJaunty = Jaunty.createInstance( {
        signingSecret: SIGNING_SECRET,
        validate( _ ) {

            return Promise.resolve( 'hello!' );

        }
    } );

    const request = { method: 'POST', headers: { authorization: 'Bearer ' + GOOD_TOKEN } };
    const next = sinon.spy();

    try {

        await customJaunty( request, null, next );

        t.ok(
            next.getCall( 0 ).args[ 0 ] instanceof TypeError,
            'throws the correct type of error'
        );

    } catch ( error ) {}

} );

test( '#Core > Throws an UnauthorizedError when isValid is false', async t => {

    t.plan( 2 );

    const customJaunty = Jaunty.createInstance( {
        signingSecret: SIGNING_SECRET,
        validate( _ ) {

            return Promise.resolve( { isValid: false } );

        }
    } );

    const request = { method: 'POST', headers: { authorization: 'Bearer ' + GOOD_TOKEN } };
    const next = sinon.spy();

    try {

        await customJaunty( request, null, next );

        t.ok(
            next.getCall( 0 ).args[ 0 ] instanceof Jaunty.Errors.UnauthorizedError,
            'throws the correct type of error'
        );

        t.ok(
            next.getCall( 0 ).args[ 0 ].message,
            'The current user does not have access to the requested resource.',
            'the error has the correct message'
        );

    } catch ( error ) {}

} );

test( '#Core > Throws an UnauthorizedError when the token is invalid', async t => {

    t.plan( 2 );

    const request = { method: 'POST', headers: { authorization: 'Bearer ' + GOOD_TOKEN + 's' } };
    const next = sinon.spy();

    try {

        await jaunty( request, null, next );

        t.ok(
            next.getCall( 0 ).args[ 0 ] instanceof Jaunty.Errors.UnauthorizedError,
            'throws the correct type of error'
        );

        t.ok(
            next.getCall( 0 ).args[ 0 ].message,
            'The current user does not have access to the requested resource.',
            'the error has the correct message'
        );

    } catch ( error ) { }

} );

test( '#Core > Sets the correct payload on successful validation [promise]', async t => {

    t.plan( 1 );

    const customJaunty = Jaunty.createInstance( {
        signingSecret: SIGNING_SECRET,
        validate( _ ) {

            return Promise.resolve( { isValid: true, payload: { hello: 'world' } } );

        }
    } );

    const request = { method: 'POST', headers: { authorization: 'Bearer ' + GOOD_TOKEN } };
    const next = sinon.spy();

    try {

        await customJaunty( request, null, next );

        t.deepEqual( request.user, {
            hello: 'world'
        }, 'the user is correctly deserialized' );

    } catch ( error ) {}

} );

test( '#Core > Sets the correct payload on successful validation [cb]', async t => {

    t.plan( 1 );

    const customJaunty = Jaunty.createInstance( {
        signingSecret: SIGNING_SECRET,
        validate( { payload }, cb ) {

            cb( null, { isValid: true, payload: { name: payload.name } } );

        }
    } );

    const request = { method: 'POST', headers: { authorization: 'Bearer ' + GOOD_TOKEN } };
    const next = sinon.spy();

    try {

        await customJaunty( request, null, next );

        t.deepEqual( request.user, {
            name: 'John Doe'
        }, 'the user is correctly deserialized' );

    } catch ( error ) {}

} );

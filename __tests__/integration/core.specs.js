const express = require( 'express' );
const supertest = require( 'supertest' );
const test = require( 'tape' );

const app = express();
const Jaunty = require( '../../lib' );

const GOOD_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJbJ3VzZXInXSIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.W-U7vJDb--3lhXqEQS_A8r0WFJAhXRE4VDt1uKtoueE';

const jwtLock = Jaunty.createInstance( {
    signingSecret: 'foobar'
} );

const jwtLockPromise = Jaunty.createInstance( {
    signingSecret: 'foobar',
    validate: ( { payload } ) => {

        return Promise.resolve( { isValid: true, payload } );

    }
} );

app.post( '/', jwtLock, ( req, res ) => res.json( req.user ) );
app.post( '/open', ( _, res ) => res.json( 'Hello!' ) );
app.post( '/promise', jwtLockPromise, ( req, res ) => res.json( req.user ) );

app.use( ( err, _, res, next ) => {

    if ( err instanceof Jaunty.Errors.BadSchemeError ||
        err instanceof Jaunty.Errors.BadTokenError ) {

        return res.status( 401 ).json( { error: 'Invalid authentication parameters.' } );

    }

    if ( err instanceof Jaunty.Errors.UnauthorizedError ) {

        return res.status( 403 ).json( { error: 'Invalid privileges.' } );

    }

    next();

} );

const request = supertest( app );

test( '#Core > open routes are accessible', async t => {

    try {

        const response = await request.post( '/open' );

        t.ok( response.ok, 'no error was handled' );
        t.equal( response.status, 200, '200 was emitted' );
        t.equal( response.body, 'Hello!', 'correct body is sent' );

        t.end();

    } catch ( error ) {

        throw error;

    }

} );

test( '#Core > gives an error when no header is provided', async t => {

    try {

        const response = await request
            .post( '/' );

        t.notOk( response.ok, 'an error was handled' );
        t.equal( response.status, 401, '401 was emitted' );

        t.end();

    } catch ( error ) {

        throw error;

    }

} );

test( '#Core > serializes the user correctly for use [noop]', async t => {

    try {

        const response = await request
            .post( '/' )
            .set( 'authorization', 'bearer ' + GOOD_TOKEN );

        t.ok( response.ok, 'no error was handled' );
        t.equal( response.status, 200, '200 was emitted' );
        t.deepEqual( response.body, {
            isNoop: true,
            header: { alg: 'HS256' },
            payload: { aud: "['user']", name: 'John Doe', iat: 1516239022 }, // eslint-disable-line quotes
            signature: 'W-U7vJDb--3lhXqEQS_A8r0WFJAhXRE4VDt1uKtoueE' }, 'the user is correctly set' );

        t.end();

    } catch ( error ) {

        throw error;

    }

} );

test( '#Core > serializes the user correctly for use [promises]', async t => {

    try {

        const response = await request
            .post( '/promise' )
            .set( 'authorization', 'bearer ' + GOOD_TOKEN );

        t.ok( response.ok, 'no error was handled' );
        t.equal( response.status, 200, '200 was emitted' );
        t.deepEqual( response.body, {
            aud: '[\'user\']', name: 'John Doe', iat: 1516239022
        }, 'the user is correctly set' );

        t.end();

    } catch ( error ) {

        throw error;

    }

} );

test( '#Core > gives a 403 on invalid token', async t => {

    try {

        const response = await request
            .post( '/promise' )
            .set( 'authorization', 'bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJbJ3VzZXInXSIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.5FNn_khYbfAc3A-MMEm7rNGbc4n2Wcj03N70bclu_kE' );

        t.notOk( response.ok, 'error was handled' );
        t.equal( response.status, 403, '403 was emitted' );
        t.deepEqual( response.body, { error: 'Invalid privileges.' }, 'the response is correct' );

        t.end();

    } catch ( error ) {

        throw error;

    }

} );

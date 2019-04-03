const express = require( 'express' );
const supertest = require( 'supertest' );
const test = require( 'tape' );

const app = express();
const Jaunty = require( '../../lib' );

const BAD_PERMISSIONS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ1c2VyIiwicGVybWlzc2lvbnMiOiJ1c2VyOndyaXRlIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ._4SpNsXjQcCToR6ZvJfbz-GFzhpYG8Xpr6mG7vObw_g';
const GOOD_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ1c2VyIiwicGVybWlzc2lvbnMiOiJhZG1pbiIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.qDnDs1o2NSA9V6C-ibnnmczVaMZGiU6Xs4dCHyygY70';

const jwtLock = Jaunty.createInstance( {
    signingSecret: 'foobar',
    validate: ( { payload } ) => {

        return Promise.resolve( { isValid: true, payload } );

    }
} );

app.post( '/', jwtLock, ( req, res ) => res.json( req.user ) );
app.post( '/open', ( _, res ) => res.json( 'Hello!' ) );
app.post( '/acl', jwtLock, Jaunty.createACL().hasPermissions( [ 'admin' ] ), ( _, res ) => res.json( 'Hello!' ) );

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

test( '#ACL > open routes are accessible', async t => {

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

test( '#ACL > permissions are checked', async t => {

    try {

        let response = await request.post( '/acl' ).set( 'authorization', 'bearer ' + BAD_PERMISSIONS_TOKEN );

        t.notOk( response.ok, 'error was handled' );
        t.equal( response.status, 403, '403 was emitted' );

        response = await request.post( '/acl' ).set( 'authorization', 'bearer ' + GOOD_TOKEN );

        t.ok( response.ok, 'no error was handled' );
        t.equal( response.status, 200, '200 was emitted' );
        t.equal( response.body, 'Hello!', 'correct body is sent' );

        t.end();

    } catch ( error ) {

        throw error;

    }

} );

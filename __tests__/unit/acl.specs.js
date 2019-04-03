const test = require( 'tape' );
const sinon = require( 'sinon' );

const createACL = require( '../../lib/acl' );
const Errors = require( '../../lib/errors' );

const invalidTypes = [ '', 100, false, {}, [] ];

test( '#ACL > throws an error when invalid options are provided', t => {

    t.plan( 4 + ( invalidTypes.length * 2 ) );

    t.throws( () => {

        createACL( { attachmentPath: undefined } );

    }, TypeError, 'throws an error when "attachmentPath" is set to undefined' );

    t.throws( () => {

        createACL( { attachmentPath: null } );

    }, TypeError, 'throws an error when "attachmentPath" is set to null' );

    t.throws( () => {

        createACL( { permissionsPath: undefined } );

    }, TypeError, 'throws an error when "permissionsPath" is set to undefined' );

    t.throws( () => {

        createACL( { permissionsPath: null } );

    }, TypeError, 'throws an error when "permissionsPath" is set to null' );

    invalidTypes.forEach( el => {

        t.throws( () => {

            createACL( { attachmentPath: el } );

        }, TypeError, `throws an error when the typeof attachmentPath is set to ${ typeof el }` );

        t.throws( () => {

            createACL( { permissionsPath: el } );

        }, TypeError, `throws an error when the typeof permissionsPath is set to ${ typeof el }` );

    } );

} );

test( '#ACL > throws an error if all permissions aren\'t arrays', t => {

    const acl = createACL();

    t.plan( invalidTypes.length - 1 );

    invalidTypes.slice( 0, invalidTypes.length - 1 ).forEach( el => {

        t.throws( () => {

            acl.hasPermissions( [ 'test' ], el );

        }, TypeError, `throws an error when permissions contain a ${ typeof el }` );

    } );

} );

test( '#ACL > throws an error if all permissions aren\'t arrays of string', t => {

    const acl = createACL();

    t.throws( () => {

        acl.hasPermissions( [ 'test' ], [ 123456789 ] );

    }, TypeError, 'throws an error when permission contains a number' );

    t.end();

} );

test( '#ACL > throws an error if the user attachment is null or undefined', t => {

    const acl = createACL();
    let next = sinon.spy();
    let request = {};

    acl.hasPermissions( [ 'user:test' ] )( request, null, next );

    t.ok( next.calledOnce, 'next is called' );
    t.ok( next.getCall( 0 ).args[ 0 ] instanceof TypeError, 'the error is of type TypeError' );
    t.equal( next.getCall( 0 ).args[ 0 ].message, 'Was expecting type object, found "undefined" for user', 'the error message is correct' );

    request = { user: null };
    next = sinon.spy();

    acl.hasPermissions( [ 'user:test' ] )( request, null, next );

    t.ok( next.calledOnce, 'next is called' );
    t.ok( next.getCall( 0 ).args[ 0 ] instanceof TypeError, 'the error is of type TypeError' );
    t.equal( next.getCall( 0 ).args[ 0 ].message, 'Was expecting type object, found "null" for user', 'the error message is correct' );

    t.end();

} );

test( '#ACL > throws an error if the permissions property is null or undefined', t => {

    const acl = createACL();
    let next = sinon.spy();
    let request = { user: {} };

    acl.hasPermissions( [ 'user:test' ] )( request, null, next );

    t.ok( next.calledOnce, 'next is called' );
    t.ok( next.getCall( 0 ).args[ 0 ] instanceof TypeError, 'the error is of type TypeError' );
    t.equal( next.getCall( 0 ).args[ 0 ].message, 'Was expecting type object, found "undefined" for permissions', 'the error message is correct' );

    request = { user: { permissions: null } };
    next = sinon.spy();

    acl.hasPermissions( [ 'user:test' ] )( request, null, next );

    t.ok( next.calledOnce, 'next is called' );
    t.ok( next.getCall( 0 ).args[ 0 ] instanceof TypeError, 'the error is of type TypeError' );
    t.equal( next.getCall( 0 ).args[ 0 ].message, 'Was expecting type object, found "null" for permissions', 'the error message is correct' );

    t.end();

} );

test( '#ACL > throws an error if the permissions property is not an array or string', t => {

    const acl = createACL();
    const next = sinon.spy();
    const request = { user: { permissions: {} } };

    acl.hasPermissions( [ 'user:test' ] )( request, null, next );

    t.ok( next.calledOnce, 'next is called' );
    t.ok( next.getCall( 0 ).args[ 0 ] instanceof TypeError, 'the error is of type TypeError' );
    t.equal(
        next.getCall( 0 ).args[ 0 ].message,
        'Was expecting the permissions property to be of type "string" or "array". Found "object".',
        'the error message is correct'
    );

    t.end();

} );

test( '#ACL > checks if permissions are acceptable for type string', t => {

    const acl = createACL();
    const next = sinon.spy();
    const request = { user: { permissions: 'user:read' } };

    acl.hasPermissions( [ 'user:read' ] )( request, null, next );

    t.ok( next.calledOnce, 'next is called' );
    t.ok( typeof next.getCall( 0 ).args[ 0 ] === 'undefined', 'next is called without any arguments' );

    t.end();

} );

test( '#ACL > checks if permissions are acceptable for type array', t => {

    const acl = createACL();
    const next = sinon.spy();
    const request = { user: { permissions: [ 'user:read' ] } };

    acl.hasPermissions( [ 'user:read' ] )( request, null, next );

    t.ok( next.calledOnce, 'next is called' );
    t.ok( typeof next.getCall( 0 ).args[ 0 ] === 'undefined', 'next is called without any arguments' );

    t.end();

} );

test( '#ACL > checks if multiple permissions are required', t => {

    const acl = createACL();
    const next = sinon.spy();
    const request = { user: { permissions: 'user:read user:write user:delete' } };

    acl.hasPermissions( [ 'user:read', 'user:write' ] )( request, null, next );

    t.ok( next.calledOnce, 'next is called' );
    t.ok( typeof next.getCall( 0 ).args[ 0 ] === 'undefined', 'next is called without any arguments' );

    t.end();

} );

test( '#ACL > checks if multiple permissions are required from a given set', t => {

    const acl = createACL();
    let next = sinon.spy();
    let request = { user: { permissions: 'user:read user:write user:delete' } };

    acl.hasPermissions( [ 'user:read', 'user:write' ], [ 'admin' ] )( request, null, next );

    t.ok( next.calledOnce, 'next is called' );
    t.ok( typeof next.getCall( 0 ).args[ 0 ] === 'undefined', 'next is called without any arguments' );

    next = sinon.spy();
    request = { user: { permissions: 'admin' } };

    acl.hasPermissions( [ 'user:read', 'user:write' ], [ 'admin' ] )( request, null, next );

    t.ok( next.calledOnce, 'next is called' );
    t.ok( typeof next.getCall( 0 ).args[ 0 ] === 'undefined', 'next is called without any arguments' );

    t.end();

} );

test( '#ACL > throws an error on insufficient permissions', t => {

    const acl = createACL();
    const next = sinon.spy();
    const request = { user: { permissions: 'user:delete' } };

    acl.hasPermissions( [ 'user:read', 'user:write' ] )( request, null, next );

    t.ok( next.calledOnce, 'next is called' );
    t.ok( next.getCall( 0 ).args[ 0 ] instanceof Errors.UnauthorizedError, 'next is called with an UnauthorizedError' );

    t.end();

} );

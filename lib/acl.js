const Utils = require( './utils' );
const Errors = require( './errors' );

/**
 * Creates an access control list validation middleware for a
 * specific route or router.
 *
 * @param {object} opts - the options to use for configuring the instance
 * @param {string} [opts.attachmentPath=user] - specifies the property name on the request object which contains
 * the deserialized user
 * @param {string} [opts.permissionsPath=permissions]  - specified the property name on the user object which
 * contains the permissions string or array
 *
 * @returns {object} an object containing functions for ACL validation
 */
module.exports = function createACL( opts ) {

    const _defaults = { attachmentPath: 'user', permissionsPath: 'permissions' };
    const options = Object.assign( _defaults, opts );

    if ( typeof options.attachmentPath !== 'string' || options.attachmentPath === null ) {

        throw new TypeError( `Was expecting a String for "options.attachmentPath"; received a ${ typeof options.attachmentPath }` );

    }

    if ( typeof options.permissionsPath !== 'string' || options.permissionsPath === null ) {

        throw new TypeError( `Was expecting a String for "options.permissionsPath"; received a ${ typeof options.permissionsPath }` );

    }

    if ( !options.attachmentPath ) {

        throw new TypeError( `Was expecting a truthy value for "options.attachmentPath"; received "${ options.attachmentPath }"` );

    }

    if ( !options.permissionsPath ) {

        throw new TypeError( `Was expecting a truthy value for "options.permissionsPath"; received "${ options.permissionsPath }"` );

    }

    return {

        hasPermissions( ..._permissions ) {

            if ( !_permissions.every( el => Array.isArray( el ) ) ) {

                throw new TypeError( 'The permissions chain has to be a list of arrays. Found offending type.' );

            }

            for ( let i = 0; i < _permissions.length; i++ ) {

                if ( !_permissions[ i ].every( el => typeof el === 'string' ) ) {

                    throw new TypeError( 'The permissions block should only contain strings. Found offending type.' );

                }

            }

            return function jauntyAclMiddleware( request, _, next ) {

                const user = request[ options.attachmentPath ];
                if ( typeof user === 'undefined' || user === null ) {

                    return next( new TypeError(
                        `Was expecting type object, found "${ Utils.getType( user ) }" for user`
                    ) );

                }

                let permissions = user[ options.permissionsPath ];
                if ( typeof permissions === 'undefined' || permissions === null ) {

                    return next( new TypeError(
                        `Was expecting type object, found "${ Utils.getType( permissions ) }" for permissions`
                    ) );

                }

                if ( typeof permissions === 'string' ) {

                    permissions = permissions.split( ' ' );

                } else if ( typeof permissions !== 'object' || !Array.isArray( permissions ) ) {

                    return next( new TypeError(
                        'Was expecting the permissions property to be of type "string" or "array". ' +
                        `Found "${ Utils.getType( permissions ) }".`
                    ) );

                }

                let hasPermissions = false;
                for ( let i = 0; i < _permissions.length; i++ ) {

                    const permissionSet = _permissions[ i ];

                    if ( permissionSet.every( el => permissions.indexOf( el ) !== -1 ) ) {

                        hasPermissions = true;
                        break;

                    }

                }

                return hasPermissions ? next() : next( new Errors.UnauthorizedError() );

            };

        }

    };

};

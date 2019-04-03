# Jaunty
A simple, easy-to-use JWT authentication and authorization middleware for [express.js](https://expressjs.com) optimised for performance.

[![forthebadge](https://forthebadge.com/images/badges/built-with-love.svg)](https://forthebadge.com)

[![Build Status](https://travis-ci.com/labsvisual/jaunty.svg?token=HCG7zqNVgsBh1FmWp7ZV&branch=master)](https://travis-ci.com/labsvisual/jaunty)
[![GitHub issues](https://img.shields.io/github/issues/labsvisual/jaunty.svg)](https://github.com/labsvisual/jaunty/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![GitHub license](https://img.shields.io/github/license/labsvisual/jaunty.svg)](https://github.com/labsvisual/jaunty/blob/master/LICENSE)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

## Introduction and Rationale
I come from a [Hapi.js](http://hapijs.com) background where most of what we want comes right out of the box or requires a little, light-weight implementation. With Express.js, however, I had the challenge of using [Passport.js](http://www.passportjs.org) which is an over-kill is you want to add server-side authentication for your RESTful APIs. Honestly, you don't need so much if all you're doing is validating just a JSON web token and adding scoped authentication and/or role based authorization. Sadly I did not have any other alternatives and hence had to use whatever I got without making a fuss about it. So I did.

The code base grew in size pretty quickly and we had a lot of developers joining us; this meant that we had to explain to them how the auth framework worked, what are the good practices, etc. This was just extraneous for something as simple as outlined above.

Finally, I decided that I had no other option but to implement a middleware myself which takes care of all of this; and hence, `jaunty` was born. As the complexity, and knobs and switches of an application grow, so does the probability of someone messing them up. In my mind, the middleware I was creating has to be as simple as possible and at the same time as extensible as possible. A very core Hapi.js philosophy.

Jaunty has only **one** required parameter and the rest of them are just augmentations on validation functions and deserializations.

## Intallation
`npm i -S jaunty jsonwebtoken`

'Bear' in mind that you need to install `jsonwebtoken` and `express` for this to work properly. They are listed, in the `package.json` file, as `peerDependencies`.

## Usage - Jaunty JWT Verification
The `jaunty` middleware helps you automatically parse, validate and deserialize [JSON Web Tokens](http://jwt.io). If you don't know what they are and how they work, I'd suggest you give the above link a read and come back.

In its simplest form, you can use `jaunty` like this:

```javascript
const Jaunty = require( 'jaunty' );

// ...
app.use( Jaunty.createInstance( {
    signingSecret: 'abc'
} ) );
// ...

app.get( '/', function homeHandler( request, response, next ) {

    return response.status( 200 ).json( request.user );

} );
```
One thing you need to pay attention to is the fact that you **MUST** attach the `jaunty` middleware **BEFORE** you attach your routes.

In the most basic sense, you're pretty much done. That's all you need.

### Options
The `.createInstance( opts: Object )` method takes an options argument with the following shape:

- `signingSecret` (`String`) - The secret used to sign the JWT.
- `validate` (`Function`) - A function which is invoked just after the signature verification of the token is complete. You can use this to verify if the user's session is valid, etc. The function signature is: `function validate( decodedToken: Object, [fn(error, data)] )`. The function can return a `Promise` (or, in extension, can be `async`) or have the second parameter as a standard error-first callback. In either case, the data which has to be returned by the function should have the following shape:
  - `isValid` (`Boolean`) - Specifies if the provided token has passed external, _probably_ non-cryptographic validation like session ID checks, etc.
  - `payload` (`Object`) [`null`] - The custom deserialized version of the JWT payload provided to the function. This can be useful in case you are fetching some additional data from your database (say, for example, the authentication/role scope). If this property is present, Jaunty will use it as the deserialized form of the user object and assign it to your specified `attachments` (documented below).
- `ignoreAuthentication` (`Set`) - A set of routes which the middleware should ignore and allow to pass without auth.
- `attachments` (`Object`) - An object which contains:
    - `request` (`String`) [`user`] - The name of the property on the `request` object which will contain the decoded and deserialized payload.
    - `response` (`String`) [`null`] - Similarly, the name of the propery on the `response` object.

### Handling `Jaunty` Errors
`Jaunty` exposes a common base error type called `AuthorizationError` which acts as the base class for all the errors emitted by `Jaunty`. Following are the errors emitted by `Jaunty` at various points in time:
  - `BadSchemeError` - this error is thrown by `Jaunty` when, for a required route, no `Authorization` header is provided or when the header is not in the form of `Authorization: Bearer <Token>`.
  - `BadTokenError` - thrown when the JWT token is malformed and/or can not be parsed.
  - `UnauthorizedError` - thrown when the user isn't authorized/authenticated to access the route.

All of these errors are exported in the `Jaunty` module as `Jaunty.Errors`. A simple example handler for errors can have the following form:

```javascript
const Jaunty = require( 'jaunty' );

// ... basic config ...

app.use( Jaunty.createInstance( {
    signingSecret: 'My_SECRET!'
} ) );

// ... other middlewares ...

app.get( '/', handler );

// ... other routes ...

app.use( function baseErrorHandler( err, req, res, next ) {

    //
    if ( err instanceof Jaunty.Errors.UnauthorizedError ) {

        return res.status( 403 ).json( {
            errors: [
                {
                    message: 'You are not allowed to access this route.'
                }
            ]
        } );

    } else if ( err instanceof Jaunty.Errors.AuthorizationError ) {

        return res.status( 401 ).json( {
            errors: [
                {
                    message: 'You are not authenticated.'
                }
            ]
        } );

    }

    return next();

} );

// ... bootstrapping code ...
```

Take note of the two things we are doing here and their order; the first construct checks _specifically_ for `UnauthorizedError` whilst the second one catches **everything else**. Make sure that the block to check for specific errors is **always at the last** to avoid confusion.

## Usage - Jaunty ACL
With release `1.1.0`, Jaunty comes with its own ACL (Access Control List) module which is, much like Jaunty, super-simple to use. To get started with the ACL, you can do something like the following:

```javascript
const Jaunty = require( 'jaunty' );
const aclProvider = Jaunty.createACL();

// Use the Jaunty to verify JWTs at a router/application level.
app.use( Jaunty.createInstance( {
    signingSecret: 'WHAT_EVER_STRING',
    ignoreAuthentication: new Set( [ '/login' ] )
} ) );

// Now you can use the ACL like so:
// Per route level
app.get( '/', aclProvider.hasPermissions( 'user:write' ), function handleGet() { ... } );

// Per router level
const adminRouter = express.Router();

adminRouter.use( aclProvider.hasPermissions( 'admin' ) );
adminRouter.get( ... );

app.use( '/admin', adminRouter );
```

### Options
The `.createACL()` function takes an object as its options. There are just two properties on the options object:

- `attachmentPath` (`String`) [`user`] - This is the path to the User's object on `express`'s `request`.
- `permissionsPath` (`String`) [`permissions`] - This is the path to the permissions property **on the `User` object**.

With the defaults, `permissions` is at `request.user.permissions`. I hope this makes sense.

After you execute `createACL()`, an `object` is returned which contains just one function (yet again) called `hasPermissions([permissions])`. This `hasPermissions()` functions is responsible for ultimately compiling and spitting out the middleware which validates the routes for permissions.

You have a couple of ways in which you can specify permissions to the `hasPermissions()` function.

- `hasPermissions( 'permission1', 'permission2' )` - this translates to: make sure the user has `permission1` **and** `permission2`;
- `hasPermissions( [ 'permission1' ], [ 'permission2', 'permission3' ] )` - this translates to: make sure the user has **either** `permission1` **or** `permission2` **and** `permission3`.

Similarly, your `permissions` object on the user can be either **an array of string** or a **space separated OAuth style scope**. Which is uber-jargon to say:

```javascript

// Type one
const user = {
    permissions: [ 'read', 'write' ]
};

// Type two
const user = {
    permissions: 'admin:read admin:write'
};
```

## Examples

### Ignore Routes
In an API, there **needs to be a way** to get the authentication token; by its very design, this route needs to be open for use without any form of user-delegated authentication. This is supported in `Jaunty` by using the `ignoreAuthentication` property while creating and initializing the instance.

```javascript
// ... other express-related stuff ...
app.use( Jaunty.createInstance( {
    signingSecret: 'WHAT_EVER_STRING',
    ignoreAuthentication: new Set( [ '/login' ] )
} ) );
// ... other express-related stuff ...
```

Now, every request sent to the `/login` route will be open and not require any form of validation.

There is one caveat, however, which is that `Jaunty` does not (yet) support method-route mapping. Which effectively translates to the fact that if you add `/login`, every HTTP verb will be ignored and not require authentication.

A fix for this will be released in the next minor version.

### Validate Sessions
Once the cryptographic verification of the token is done, an optional callback function can be supplied which checks if the session for that token is still valid. The `validate` property provided to `Jaunty` takes the form `function( token: Object, [function (error, data)] )`. Let's see a quick example of that in actions:

In the `app.js` file, you can have the middleware defined as follows:

```javascript
// app.js

// ... express stuff ...
app.use( Jaunty.createInstance( {
    signingSecret: 'MY_SUPER_SECRET',
    validate: require( './validate' )
} ) );

// ... other middlewares ...
// ... error handlers ...

module.exports = app;
```

And in your `validate.js` file you can have something like the following:

```javascript
// validate.js

const { Session } = require( '../models' );

module.exports = async function validateJWT( token ) {

    try {

        /*
         * The token is a COMPLETE decode of the data which
         * means that it includes the header. In general,
         * following is the shape of a JWT:
         *      {
         *          header: Object,
         *          payload: Object,
         *          signature: String | Buffer
         *      }
         */

        // You can also detructure it in the argument definition.
        const { payload } = token;
        const sessionData = await Session.findById( payload.sessionId );

        if ( !sessionData ) {

            return { isValid: false };

        }

        if ( sessionData.userId === payload.userId ) {

            return {
                isValid: true,

                /*
                 * You can also, optionally, specify a payload.
                 * If provided, Jaunty will use that when it
                 * attaches the deserialized user to the
                 * attachment you have provided.
                 */
                payload: {}
            }

        }

    } catch ( error ) {

        // Jaunty will catch it and respond.
        throw error;

    }

};
```

What `Jaunty` will effectively do is that once the provided JWT gets cryptographically validated, it'll call the `validate()` method with the entire token. You can now run your own checks and add whatever logic you deem fit. Finally, return an object which contains `{ isValid: Boolean }` and optionally the modified version of the token payload you want.

Which means that whatever you return in the `payload` property will be what you can access from `request.user`.

## Advice on Security
Just to make your application extra secure, please do **not** store the signing secret in any unsafe/insecure place and make sure that you rotate it regularly.

In case you want better security, think about using asymmetric key pairs (support coming soon) for signing and verifying JW tokens.

One of the best methods of managing sensitive cryptographic keys is to use [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) along with [AWS Key Management Service](https://aws.amazon.com/kms/?nc2=h_m1).

For systems not so heavy on compliance, you can get away with dynamic environment variables written in your `.env` file at the time of build on the CI. This comes with its own risk since the hardware on which the CI builder runs is multi-tenacy.

## Contributing
In case you have a feature in mind or a bug fix, feel free to send a PR! And don't worry; your PRs won't be ignored: at all.

### Style Guide
The project uses the [xo](https://github.com/xojs/xo) coding style with a few modifications.

To aid with changelog generation and release management, we urge everyone to use the [`conventional-changelog`](https://www.npmjs.com/package/cz-conventional-changelog) format. In case you don't want to pollute the system with another global binary, you can just follow the commit style while writing your message. (Personally, I find that to be faster.)

## License
Copyright 2019 Shreyansh Pandey

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

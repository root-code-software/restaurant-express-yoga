
const { AuthenticationError } = require('apollo-server-core');
const { verify } = require('../../../lib/jsonwebtoken/jwt');

module.exports = async (resolve, root, args, context, info) => {
    let token;
    try {
        token = verify(context.request.get('Authorization'));
    } catch (e) {
        return new AuthenticationError("Not authorised");
    }
    context.claims = token.claims;
    const result = await resolve(root, args, context, info);
    return result;
};

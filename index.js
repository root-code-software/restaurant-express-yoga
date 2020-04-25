const { GraphQLServer } = require('graphql-yoga');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const typeDefs = `
type Query { 
    hello(name: String): String! 
}
  type Mutation {
    login(email: String!, password: String!): String!
    signup(email: String!, password: String!): String!
  }
`;

const data = {};

const resolvers = {
    Query: {
        hello: (_, { name }, ctx) => {
            if (ctx.claims !== "read-post") {
                return new Error("not claims");
            }
            return `Hello ${name || "World"}`;
        }
    },
    Mutation: {
        signup: async (_, { email, password }) => {
            if (data[email]) {
                throw new Error('Another User with same username exists.');
            }

            data[email] = {
                password: await bcrypt.hashSync(password, 10),
            };



            return 'User created';
        },
        login: async (_, { email, password }) => {
            const user = data[email];
            if (user) {
                if (await bcrypt.compareSync(password, user.password)) {

                    var token = jwt.sign({ claims: 'read-post', email }, 'secret');
                    return token;
                }

                throw new Error('Incorrect password.');
            }

            throw new Error('No Such User exists.');
        },
    }
};

const authenticate = async (resolve, root, args, context, info) => {
    if (context.request.get("Authorization")) {
        let token;
        try {
            token = jwt.verify(context.request.get("Authorization"), "secret");
        } catch (e) {
            return new Error("Not authorised");
        }
        context.claims = token.claims;
    }

    const result = await resolve(root, args, context, info);
    return result;
};

const server = new GraphQLServer({
    typeDefs,
    resolvers,
    context: req => ({ ...req }),
    middlewares: [authenticate]
});

server.start(() => console.log("Server is running on http://localhost:4000"));
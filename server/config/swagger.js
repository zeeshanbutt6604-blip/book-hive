import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Book Hive API",
      version: "1.0.0",
      description: "A comprehensive API for Book Hive - Authentication, Posts, and Comments",
    },
    servers: [
      {
        url: "http://192.168.18.207:5274",
        description: "Development server (Network)",
      },
      {
        url: "http://localhost:5274",
        description: "Development server (Local)",
      },
    ],
    components: {
      securitySchemes: {
        accessTokenAuth: {
          type: "apiKey",
          in: "header",
          name: "access-token",
          description:
            "Enter your JWT access token. Get this token by logging in via POST /api/auth/login",
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication endpoints",
      },
      {
        name: "User Management",
        description:
          "User profile and account management (requires authentication)",
      },
      {
        name: "Password Management",
        description: "Password reset and update operations",
      },
      {
        name: "Posts",
        description: "Post management endpoints",
      },
      {
        name: "Comments",
        description: "Comment management endpoints",
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js"],
};

const specs = swaggerJsdoc(options);

export default specs;

module.exports = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDJmZjYwZjU1ZGViNDAwMTVmMWYzZmQiLCJpYXQiOjE2MTM3NTU5MTksImV4cCI6MTYxNDM2MDcxOX0.P - MPAAxgW_8bzLM2hkSWmQQ0DaevVEE - 36UZrocCTI4",
    },
  },
  schemas: {
    userRegister: {
      type: "object",
      required: ["email", "phone", "password"],
      properties: {
        username: { type: "string", example: "abdul" },
        email: { type: "string", example: "abdulllooohhh@gmail.com" },
        phone: { type: "string", example: "123456789" },
        password: { type: "string", example: "ghay28d7d7" },
      },
    },
  },
  examples: {
    isExist: {
      success: false,
      field: "email",
      msg: "Email exists, please sign in with google option",
    },
    isInvalidData: {
      success: false,
      field: "username",
      msg: '"username" length must be at least 3 characters long',
    },
  },
};

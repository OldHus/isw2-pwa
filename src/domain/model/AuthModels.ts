export type AuthResult =
  | { type: "existingUser"; uid: string; role: string; courseId: string; name: string; photoUrl: string }
  | { type: "newUser"; uid: string };

export type AuthError =
  | { type: "cancelledByUser" }
  | { type: "noInternet" }
  | { type: "domainNotAllowed" }
  | { type: "invalidCredentials" }
  | { type: "unknown"; message: string };
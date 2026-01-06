import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest so it doesn't throw a 401 error if no token is present
  handleRequest(err, user, info) {
    // If a user is found (valid token), return the user.
    // If not, return null (allow the request to proceed as "guest").
    return user || null;
  }
}
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service'; // AuthService to manage token

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.authService.getAccessToken(); // Retrieve the current access token from storage or AuthService

    // Clone the request and set the Authorization header with the token
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next.handle(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // If the error is an authentication error (401), try refreshing the token
        if (error.status === 401 && !req.url.includes('refresh-token')) {
          return this.handle401Error(req, next);
        }
        // Otherwise, return the error
        return throwError(error);
      })
    );
  }

  private handle401Error(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Make a request to refresh the token
    return this.authService
      .refreshToken(
        this.authService.getAccessToken()!,
        this.authService.getRefreshToken()!
      )
      .pipe(
        take(1),
        switchMap((response: { accessToken: string; refreshToken: string }) => {
          // Save the new token
          this.authService.setAccessToken(response.accessToken);
          this.authService.setRefreshToken(response.refreshToken);

          // Clone the original request and retry it with the new token
          const clonedRequest = req.clone({
            setHeaders: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          });
          return next.handle(clonedRequest);
        }),
        catchError((err) => {
          // Handle refresh token failure, e.g., log out the user
          this.authService.logout();
          return throwError(err);
        })
      );
  }
}

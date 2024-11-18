import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { KEY_STORAGE } from '../constants/storage.constants';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../constants/api.constants';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private accessTokenSubject: BehaviorSubject<string | null>;
  private refreshTokenSubject: BehaviorSubject<string | null>;
  authUrl = `${API_URL}/Auth`;
  constructor(private http: HttpClient) {
    this.accessTokenSubject = new BehaviorSubject<string | null>(
      localStorage.getItem(KEY_STORAGE.accessToken)
    );
    this.refreshTokenSubject = new BehaviorSubject<string | null>(
      localStorage.getItem(KEY_STORAGE.refreshToken)
    );
  }

  getAccessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  getRefreshToken(): string | null {
    return this.refreshTokenSubject.value;
  }

  setAccessToken(token: string): void {
    localStorage.setItem(KEY_STORAGE.accessToken, token);
    this.accessTokenSubject.next(token);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(KEY_STORAGE.refreshToken, token);
    this.refreshTokenSubject.next(token);
  }

  login(usernameOrEmail: string, password: string): Observable<any> {
    let body = {
      usernameOrEmail: usernameOrEmail,
      password: password,
    };
    return this.http.post(`${this.authUrl}/login`, body);
  }

  refreshToken(accessToken: string, refreshToken: string): Observable<any> {
    let body = {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
    return this.http.post(`${this.authUrl}/refresh-token`, body);
  }

  logout() {
    localStorage.clear();
    this.accessTokenSubject.next(null);
    this.refreshTokenSubject.next(null);
  }
}

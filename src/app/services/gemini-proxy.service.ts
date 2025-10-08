import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeminiProxyService {
  constructor(private http: HttpClient) {}

  sendToGemini(payload: any): Observable<any> {
    return this.http.post('/api/gemini', payload);
  }
}

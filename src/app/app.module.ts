import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { ChatPanelComponent } from './components/chat-panel/chat-panel.component';
import { AppRoutingModule } from './app-routing.module';
import { GeminiService } from './services/gemini.service';

@NgModule({
  declarations: [AppComponent, ChatPanelComponent],
  imports: [BrowserModule, FormsModule, AppRoutingModule],
  providers: [GeminiService],
  bootstrap: [AppComponent]
})
export class AppModule {}

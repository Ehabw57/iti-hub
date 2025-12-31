import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nService } from './core/services/i18n.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private i18n = inject(I18nService);

  ngOnInit(): void {
    // Initialize i18n service to set correct dir and lang on document
  }
}

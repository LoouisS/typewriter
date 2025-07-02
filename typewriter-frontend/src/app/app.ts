import { Component } from '@angular/core';
import { TypewriterDashboardComponent } from './typewriter-dashboard/typewriter-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TypewriterDashboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'typewriter-frontend';
}

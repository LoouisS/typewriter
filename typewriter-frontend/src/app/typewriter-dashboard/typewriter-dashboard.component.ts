import { Component } from '@angular/core';
import { TypewriterRecorder } from '../components/typewriter-recorder/typewriter-recorder';

@Component({
  selector: 'app-typewriter-dashboard',
  standalone: true,
  imports: [TypewriterRecorder],
  templateUrl: './typewriter-dashboard.component.html',
  styleUrls: ['./typewriter-dashboard.component.scss']
})
export class TypewriterDashboardComponent {} 
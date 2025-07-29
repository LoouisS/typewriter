import { Component } from '@angular/core';
import { TypewriterRecorder } from '../components/typewriter-recorder/typewriter-recorder';
import { Menu } from '../components/menu/menu';

@Component({
  selector: 'app-typewriter-dashboard',
  standalone: true,
  imports: [TypewriterRecorder, Menu],
  templateUrl: './typewriter-dashboard.component.html',
  styleUrls: ['./typewriter-dashboard.component.scss']
})
export class TypewriterDashboardComponent {

} 
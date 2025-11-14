import './bootstrap';

// Import Alpine.js
import Alpine from 'alpinejs';
window.Alpine = Alpine;
Alpine.start();

// Import Swiper Element and modules
import { register } from 'swiper/element/bundle';

// Register Swiper custom elements
// The bundle includes all modules (Grid, Navigation, Pagination, etc.)
register();

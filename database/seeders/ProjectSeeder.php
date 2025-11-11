<?php

namespace Database\Seeders;

use App\Models\Project;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $projects = [
            [
                'name' => 'DJ Forge',
                'slug' => 'dj-forge',
                'description' => 'Control your Spotify desktop app with natural language commands powered by Claude AI. Features instant playback control, smart search, and intelligent playlist management through conversational commands.',
                'url' => 'https://github.com/yourusername/djforge',
                'desktop_image' => 'images/projects/djforge-desktop.jpg',
                'mobile_image' => 'images/projects/djforge-mobile.jpg',
                'order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Panel Forge',
                'slug' => 'panel-forge',
                'description' => 'AI-powered comic creation studio built with Laravel and NativePHP. Generate stunning panel artwork from text prompts, refine with precision inpainting, and organize your story with hierarchical project management.',
                'url' => 'https://github.com/yourusername/panel-forge',
                'desktop_image' => 'images/projects/panelforge-desktop.jpg',
                'mobile_image' => 'images/projects/panelforge-mobile.jpg',
                'order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Swift Danish',
                'slug' => 'swift-danish',
                'description' => 'Interactive Danish language learning platform featuring engaging mini-games like Match Madness. Built with Laravel, Vue.js, and Tailwind CSS to make learning Danish swiftly and enjoyably.',
                'url' => 'https://github.com/yourusername/swiftdanish',
                'desktop_image' => 'images/projects/swiftdanish-desktop.jpg',
                'mobile_image' => 'images/projects/swiftdanish-mobile.jpg',
                'order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Family Calendar',
                'slug' => 'family-calendar',
                'description' => 'A beautiful family calendar web application displaying upcoming events, celebrations, and travel plans. Features Taylor Swift-inspired gradients and animated sparkles for special occasions.',
                'url' => 'https://calendar.danishdave.com',
                'desktop_image' => 'images/projects/calendar-desktop.jpg',
                'mobile_image' => 'images/projects/calendar-mobile.jpg',
                'order' => 4,
                'is_active' => true,
            ],
            [
                'name' => 'Danish Dave Blog',
                'slug' => 'blog',
                'description' => 'Personal blog documenting life experiences in Denmark. Covering travel stories, daily life in Copenhagen, and cultural observations through narrative-style posts.',
                'url' => 'https://blog.danishdave.com',
                'desktop_image' => 'images/projects/blog-desktop.jpg',
                'mobile_image' => 'images/projects/blog-mobile.jpg',
                'order' => 5,
                'is_active' => true,
            ],
        ];

        foreach ($projects as $project) {
            Project::create($project);
        }
    }
}

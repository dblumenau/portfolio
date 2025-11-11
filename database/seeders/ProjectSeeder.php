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
                'description' => 'Control your Spotify desktop app with natural language commands powered by GPT 5, and OpenAI\'s Responses API. It has a rich system of tools, including full integration with Genius Lyrics and of course the ability to do nearly anything that you can do with the Spotify API, but using natural language. GPT-5 automatically decidsse which tool(s) to call in order to accomplish the task you want. I forced myself to make it fully Typescript compliant and built in React and Express.',
                'url' => 'https://client.djforge.danishdave.com',
                'desktop_image' => 'images/projects/djforge-desktop.png',
                'mobile_image' => 'images/projects/djforge-mobile.png',
                'order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Panel Forge',
                'slug' => 'panel-forge',
                'description' => 'AI-powered comic creation studio built with Laravel and NativePHP. Generate stunning panel artwork from text prompts, refine with precision inpainting, and organize your story with hierarchical project management.',
                'url' => 'https://panelforge.danishdave.com',
                'desktop_image' => 'images/projects/panelforge-desktop.png',
                'mobile_image' => 'images/projects/panelforge-mobile.png',
                'order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Swift Danish',
                'slug' => 'swift-danish',
                'description' => 'Interactive Danish language learning platform featuring engaging mini-games like Match Madness. Built with Laravel, Vue.js, and Tailwind CSS to make learning Danish swiftly and enjoyably.',
                'url' => 'https://swiftdanish.danishdave.com/welcome',
                'desktop_image' => 'images/projects/swiftdanish-desktop.png',
                'mobile_image' => 'images/projects/swiftdanish-mobile.png',
                'order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Family Calendar',
                'slug' => 'family-calendar',
                'description' => 'A beautiful family calendar web application displaying upcoming events, celebrations, and travel plans. Features Taylor Swift-inspired gradients and animated sparkles for special occasions. I made it using an instance of Claude Code that runs on my Hetzner VPS from my iPhone using SSH with Termius, during one Uber ride from Cape Town to Somerset West. My boyfriend suggested the colour schemes and some functionality and I just went with it. It ended up being very useful during our trip there to Johannesburg because getting my family to co-ordinate plans is like herding cats.',
                'url' => 'https://calendar.danishdave.com',
                'desktop_image' => 'images/projects/calendar-desktop.png',
                'mobile_image' => 'images/projects/calendar-mobile.png',
                'order' => 4,
                'is_active' => true,
            ],
            [
                'name' => 'Danish Dave Blog',
                'slug' => 'blog',
                'description' => 'Personal blog documenting life experiences in Denmark. Covering my interests in AI, tech, travel stories, daily life in Copenhagen, and cultural observations through narrative-style posts. That in particular is all written by me in my own unique way of writing. The blog is powered by Ghost, so that it limits distractions and allows me to focus on writing and not tinkering with the blog software itself, which I would inevitably do if I built it myself.',
                'url' => 'https://blog.danishdave.com',
                'desktop_image' => 'images/projects/blog-desktop.png',
                'mobile_image' => 'images/projects/blog-mobile.png',
                'order' => 5,
                'is_active' => true,
            ],
        ];

        foreach ($projects as $project) {
            Project::create($project);
        }
    }
}

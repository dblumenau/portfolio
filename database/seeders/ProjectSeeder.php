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
                'name_da' => 'DJ Forge',
                'slug' => 'dj-forge',
                'description' => 'Control your Spotify desktop app with natural language commands powered by GPT 5, and OpenAI\'s Responses API. It has a rich system of tools, including full integration with Genius Lyrics and of course the ability to do nearly anything that you can do with the Spotify API, but using natural language. GPT-5 automatically decidsse which tool(s) to call in order to accomplish the task you want. I forced myself to make it fully Typescript compliant and built in React and Express.',
                'description_da' => 'Kontrollér din Spotify desktop-app med naturlige sprogkommandoer drevet af GPT 5 og OpenAI\'s Responses API. Den har et rigt system af værktøjer, herunder fuld integration med Genius Lyrics og selvfølgelig muligheden for at gøre næsten alt, hvad du kan med Spotify API\'en, men ved hjælp af naturligt sprog. GPT-5 beslutter automatisk, hvilke værktøjer der skal kaldes for at udføre den opgave, du ønsker. Jeg tvang mig selv til at gøre den fuldt Typescript-compliant og byggede den i React og Express.',
                'url' => 'https://client.djforge.danishdave.com',
                'desktop_image' => 'images/projects/dj_forge_desktop.png',
                'mobile_image' => 'images/projects/dj_forge_mobile.png',
                'order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Panel Forge',
                'name_da' => 'Panel Forge',
                'slug' => 'panel-forge',
                'description' => 'AI-powered comic creation studio built with Laravel and NativePHP. Generate stunning panel artwork from text prompts, refine with precision inpainting, and organize your story with hierarchical project management.',
                'description_da' => 'AI-drevet tegneserie-kreationsstudio bygget med Laravel og NativePHP. Generer fantastisk panel-kunst fra tekstprompts, forfin med præcisions-inpainting, og organisér din historie med hierarkisk projektstyring.',
                'url' => 'https://panelforge.danishdave.com',
                'desktop_image' => 'images/projects/panel_forge_desktop.png',
                'mobile_image' => 'images/projects/panel_forge_mobile.png',
                'order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Swift Danish',
                'name_da' => 'Swift Danish',
                'slug' => 'swift-danish',
                'description' => 'Interactive Danish language learning platform featuring engaging mini-games like Match Madness. Built with Laravel, Vue.js, and Tailwind CSS to make learning Danish swiftly and enjoyably.',
                'description_da' => 'Interaktiv danskindlæringsplatform med engagerende minispil som Match Madness. Bygget med Laravel, Vue.js og Tailwind CSS for at gøre det hurtigt og sjovt at lære dansk.',
                'url' => 'https://swiftdanish.danishdave.com/welcome',
                'desktop_image' => 'images/projects/swift_danish_desktop.png',
                'mobile_image' => 'images/projects/swift_danish_mobile.png',
                'order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Family Calendar',
                'name_da' => 'Familiekalender',
                'slug' => 'family-calendar',
                'description' => 'A beautiful family calendar web application displaying upcoming events, celebrations, and travel plans. Features Taylor Swift-inspired gradients and animated sparkles for special occasions. I made it using an instance of Claude Code that runs on my Hetzner VPS from my iPhone using SSH with Termius, during one Uber ride from Cape Town to Somerset West. My boyfriend suggested the colour schemes and some functionality and I just went with it. It ended up being very useful during our trip there to Johannesburg because getting my family to co-ordinate plans is like herding cats.',
                'description_da' => 'En smuk familiekalender-webapplikation, der viser kommende begivenheder, fejringer og rejseplaner. Har Taylor Swift-inspirerede gradienter og animerede gnister til særlige lejligheder. Jeg lavede den ved hjælp af en instans af Claude Code, der kører på min Hetzner VPS fra min iPhone ved hjælp af SSH med Termius, under én Uber-tur fra Cape Town til Somerset West. Min kæreste foreslog farveskemaerne og noget funktionalitet, og jeg bare kørte med det. Det endte med at være meget nyttigt under vores tur til Johannesburg, fordi at få min familie til at koordinere planer er som at hyrde katte.',
                'url' => 'https://calendar.danishdave.com',
                'desktop_image' => 'images/projects/calendar_desktop.png',
                'mobile_image' => 'images/projects/calendar_mobile.png',
                'order' => 4,
                'is_active' => true,
            ],
            [
                'name' => 'Danish Dave Blog',
                'name_da' => 'Danish Dave Blog',
                'slug' => 'blog',
                'description' => 'Personal blog documenting life experiences in Denmark. Covering my interests in AI, tech, travel stories, daily life in Copenhagen, and cultural observations through narrative-style posts. That in particular is all written by me in my own unique way of writing. The blog is powered by Ghost, so that it limits distractions and allows me to focus on writing and not tinkering with the blog software itself, which I would inevitably do if I built it myself.',
                'description_da' => 'Personlig blog, der dokumenterer livsoplevelser i Danmark. Dækker mine interesser i AI, tech, rejsehistorier, dagligliv i København og kulturelle observationer gennem fortællende indlæg. Det er især alt sammen skrevet af mig på min egen unikke måde. Bloggen er drevet af Ghost, så den begrænser distraktioner og giver mig mulighed for at fokusere på at skrive og ikke pille ved blog-softwaren selv, hvilket jeg uundgåeligt ville gøre, hvis jeg byggede den selv.',
                'url' => 'https://blog.danishdave.com',
                'desktop_image' => 'images/projects/blog_desktop.png',
                'mobile_image' => 'images/projects/blog_mobile.png',
                'order' => 5,
                'is_active' => true,
            ],
            [
                'name' => 'Danish Dave Portfolio',
                'name_da' => 'Danish Dave Portfolio',
                'slug' => 'portfolio',
                'description' => 'Whoa talk about meta. That\'s this site! So this site is my personal portfolio website where I showcase my projects, skills, and experiences as a developer and tech enthusiast. The site includes sections for my bio, project highlights (which is literally the thing you are reading, I CANNOT with this level of meta), links to my blog, and contact information.',
                'description_da' => 'Whoa, snakker vi om meta. Det er denne side! Så denne side er min personlige portfolio-hjemmeside, hvor jeg fremviser mine projekter, færdigheder og erfaringer som udvikler og tech-entusiast. Siden inkluderer sektioner for min bio, projekthighlights (som bogstaveligt talt er det, du læser, jeg kan IKKE med dette niveau af meta), links til min blog og kontaktinformation.',
                'url' => 'https://danishdave.com',
                'desktop_image' => 'images/projects/portfolio-desktop.png',
                'mobile_image' => 'images/projects/portfolio-mobile.png',
                'order' => 6,
                'is_active' => true,
            ],
        ];

        foreach ($projects as $project) {
            Project::create($project);
        }
    }
}

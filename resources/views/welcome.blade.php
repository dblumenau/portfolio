<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Portfolio of David Blumenau (Danish Dave) - Full-stack developer in Copenhagen creating AI-powered applications, language learning platforms, and innovative web experiences with Laravel, React, and modern web technologies.">
    <title>Danish Dave - Portfolio</title>
    <link rel="icon" type="image/png" href="{{ asset('favicon.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('apple-touch-icon.png') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-slate-900 text-slate-100">
<!-- Navigation -->
<nav class="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
    <div class="container mx-auto px-4 py-0 flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center">
            <img src="{{ asset('images/logo.png') }}" alt="Danish Dave" class="h-12 md:h-14 py-1">
        </div>

        <!-- Nav Links -->
        <div class="flex items-center gap-4 md:gap-6">
            <a href="#projects" class="nav-link text-slate-300 hover:text-cyan-400 transition-all text-sm md:text-base" data-section="projects">Portfolio</a>
            <a href="#about" class="nav-link hidden sm:block text-slate-300 hover:text-cyan-400 transition-all text-sm md:text-base" data-section="about">About</a>
            <a href="#ai-development" class="nav-link hidden sm:block text-slate-300 hover:text-cyan-400 transition-all text-sm md:text-base" data-section="ai-development">AI Supervision</a>
            <a href="#contact" class="nav-link text-slate-300 hover:text-cyan-400 transition-all text-sm md:text-base" data-section="contact">Contact</a>
            <a href="https://blog.danishdave.com" target="_blank" rel="noopener noreferrer" class="nav-link blog-link text-[#C8102E] hover:text-[#C8102E] transition-all text-sm md:text-base">Blog</a>
        </div>
    </div>
</nav>

<!-- Hero Section with Swiper -->
<section id="projects" class="min-h-screen relative bg-gradient-to-b from-slate-950 to-slate-900 pt-14">
    <!-- View Toggle Button -->
    <div class="absolute top-20 right-4 md:right-8 z-50">
        <button id="view-toggle" class="glass rounded-full px-4 py-2 md:px-6 md:py-3 flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/30 shadow-lg">
            <svg id="toggle-icon-coverflow" class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>
            </svg>
            <svg id="toggle-icon-grid" class="w-5 h-5 text-cyan-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
            </svg>
            <span id="toggle-text" class="text-slate-100 font-medium text-sm md:text-base">Grid View</span>
        </button>
    </div>

    <!-- Swiper Carousel -->
    <div id="swiper-container" class="relative w-full h-screen flex items-center justify-center">
        <!-- Coverflow Swiper -->
        <swiper-container
            id="swiper-coverflow"
            class="w-full swiper-responsive"
            effect="coverflow"
            grab-cursor="true"
            centered-slides="true"
            slides-per-view="auto"
            coverflow-effect-modifier="1"
            coverflow-effect-slide-shadows="false"
            autoplay-delay="15000"
            autoplay-disable-on-interaction="false"
            loop="true"
            navigation="true"
            pagination="true"
            pagination-clickable="true"
        >
            @foreach ($projects as $project)
                <swiper-slide class="swiper-slide-responsive">
                    <div class="glass rounded-2xl p-6 md:p-10 h-full flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/10">
                        <!-- Project Image -->
                        <div class="relative mb-4 md:mb-6 flex-shrink-0">
                            <picture class="cursor-zoom-in" onclick="openLightbox('{{ asset($project->desktop_image) }}', '{{ $project->name }}');">
                                <!-- Mobile image for small screens -->
                                <source
                                    media="(max-width: 768px)"
                                    srcset="{{ asset($project->mobile_image) }}"
                                >
                                <!-- Desktop image for larger screens -->
                                <img
                                    src="{{ asset($project->desktop_image) }}"
                                    alt="{{ $project->name }}"
                                    class="w-full max-h-[350px] md:h-80 md:max-h-none md:object-cover object-contain rounded-xl"
                                >
                            </picture>
                            <!-- Overlay gradient -->
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent rounded-xl pointer-events-none"></div>
                        </div>

                        <!-- Project Info -->
                        <div class="flex-grow flex flex-col min-h-0">
                            <!-- Visit Link -->
                            <a href="{{ $project->url }}" target="_blank" rel="noopener noreferrer" class="inline-block mb-2 md:mb-3 flex-shrink-0">
                                <div class="flex items-center text-cyan-400 font-medium text-sm md:text-base hover:text-cyan-300 transition-colors">
                                    <span>Visit Project</span>
                                    <svg class="w-4 h-4 md:w-5 md:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                    </svg>
                                </div>
                            </a>

                            <h3 class="text-xl md:text-3xl font-bold text-cyan-400 mb-2 md:mb-4 break-words flex-shrink-0">
                                {{ $project->name }}
                            </h3>
                            <p class="text-slate-300 text-sm md:text-lg leading-relaxed break-words overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
                                {{ $project->description }}
                            </p>
                        </div>
                    </div>
                </swiper-slide>
            @endforeach
        </swiper-container>

        <!-- Grid View -->
        <div id="grid-view" class="w-full hidden px-4 md:px-8 pt-24 pb-16">
            <div class="grid grid-cols-2 gap-3 md:gap-4 max-w-7xl mx-auto">
                @foreach ($projects as $project)
                    <div class="project-card cursor-pointer"
                         data-project-name="{{ $project->name }}"
                         data-project-description="{{ $project->description }}"
                         data-project-url="{{ $project->url }}"
                         data-project-desktop-image="{{ asset($project->desktop_image) }}"
                         data-project-mobile-image="{{ asset($project->mobile_image) }}">
                        <div class="glass rounded-xl md:rounded-2xl p-3 md:p-6 h-full flex flex-col transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 overflow-y-auto">
                            <!-- Project Image -->
                            <div class="relative mb-2 md:mb-4 flex-shrink-0">
                                <picture>
                                    <!-- Mobile image for small screens -->
                                    <source
                                        media="(max-width: 768px)"
                                        srcset="{{ asset($project->mobile_image) }}"
                                    >
                                    <!-- Desktop image for larger screens -->
                                    <img
                                        src="{{ asset($project->desktop_image) }}"
                                        alt="{{ $project->name }}"
                                        class="w-full h-32 md:h-48 object-contain rounded-lg"
                                    >
                                </picture>
                                <!-- Overlay gradient -->
                                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent rounded-lg pointer-events-none"></div>
                            </div>

                            <!-- Project Info -->
                            <div class="flex-grow">
                                <h3 class="text-sm md:text-xl font-bold text-cyan-400 mb-1 md:mb-2 break-words">
                                    {{ $project->name }}
                                </h3>
                                <p class="text-slate-300 text-xs md:text-sm leading-relaxed break-words line-clamp-3 md:line-clamp-4">
                                    {{ $project->description }}
                                </p>
                            </div>

                            <!-- Mobile Tap Indicator -->
                            <div class="mt-3 md:hidden">
                                <div class="flex items-center justify-center gap-2 bg-cyan-400/10 border border-cyan-400/30 rounded-lg px-3 py-2 text-cyan-400 text-xs font-medium">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                                    </svg>
                                    <span>Tap for details</span>
                                </div>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
</section>

<!-- About Section -->
<section id="about" class="py-8 md:py-16 bg-slate-900">
    <div class="container mx-auto px-4 max-w-5xl">
        <div class="glass rounded-2xl p-8 md:p-12">
            <div class="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start">
                <!-- Profile Image -->
                <div class="flex-shrink-0 md:mt-22">
                    <img
                        src="{{ asset('images/david.jpeg') }}"
                        alt="David Blumenau"
                        class="w-48 md:w-64 rounded-2xl border-2 border-cyan-400/30 shadow-lg shadow-cyan-500/20"
                    >
                </div>

                <!-- Text Content -->
                <div class="flex-1">
                    <h2 class="text-4xl md:text-5xl font-bold text-center md:text-left mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        About Me
                    </h2>
                    <div class="space-y-6 text-slate-300 text-lg leading-relaxed">
                        <p>
                            Hey there! I'm David Blumenau, but you might know me as <span class="text-cyan-400 font-semibold">Danish Dave</span> – a name my cousins bestowed upon me when I decided to permanently emigrate to Denmark.
                        </p>
                        <p>Btw that em dash above was not ChatGPT for once – but my goodness how ChatGPT <span class="text-cyan-400 font-semibold">loves herself</span> a hearty portion of – aka the em dash in every paragraph)!</p>
                        <p>
                            I am also a massive fan of <span class="text-cyan-400 font-semibold">Taylor Swift</span>. <br>Is that relevant to my portfolio? <br> <span class="text-cyan-400 font-semibold">Not at all</span> but I still had to put it there.
                        </p>
                        <p>
                            From natural language interfaces for music control to AI-powered creative studios, I love exploring the intersection of technology and everyday experiences.
                        </p>
                        <p class="text-xs">Okay that above sentence was AI and so is half of the next one.
                        </p>
                        <p>Whether it's creating tools to help myself and fellow Danish students learn languages through mini games or documenting life's adventures in Denmark,<code class="text-gray-500">&lt;/endai&gt;</code>or trying out how far I can make a bot that controls my Spotify in one weekend (although that ended up sending me down a rabbit hole of Responses API and GPT function calling for more than a month) I'm all about creating and <span class="text-cyan-400 font-semibold">exploring what is possible</span> in this weird as fuck future we are living in.
                        </p>
                        <p>
                            I have worked with <span class="text-cyan-400 font-semibold">Laravel, Vue.js, React, Tailwind CSS</span>, and <span class="text-cyan-400 font-semibold">OpenAI+Anthropic+Gemini</span> APIs to create some truly epic apps and websites. I see each project as an opportunity to learn something new.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- AI Supervision & Architecture Section -->
<section id="ai-development" class="py-8 md:py-16 bg-slate-950">
    <div class="container mx-auto px-4 max-w-6xl">
        <h2 class="text-4xl md:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            AI Supervision & Architecture
        </h2>

        <div class="space-y-8">
            <!-- Intro -->
            <div class="text-center max-w-4xl mx-auto mb-12">
                <p class="text-slate-300 text-lg leading-relaxed">
                    My 14 years of full-stack development experience has given me the ability to use Claude Code to architect (is that a verb?) and deliver interesting projects rapidly.
                </p>
                <p class="text-slate-300 text-lg leading-relaxed">Mostly just for me and sometimes my boyfriend and still rarer sometimes my friends and family.
                    <br><br>
                    This entire portfolio website that you are looking at was done in one shot, <span class="text-cyan-400 font-semibold">from concept to production deployment</span>. Below are the exact prompts that I used.
                    <br><br>I think for me* that <span class="text-cyan-400 font-semibold">demonstrates what I see in the power of AI<span class="text-cyan-400 font-semibold"> when combined with a developer that has enough experience</span>.
                </p>
            </div>

            <!-- Code Blocks Grid -->
            <div class="grid md:grid-cols-2 gap-6 md:gap-8">
                <!-- First Prompt -->
                <div class="space-y-4">
                    <h3 class="text-xl font-semibold text-cyan-400">Initial Project Prompt</h3>
                    <div class="glass rounded-xl p-6">
                            <pre class="text-xs md:text-sm text-cyan-100 font-mono leading-relaxed whitespace-pre-wrap break-words"><code>I have created several development and product projects,
DJ Forge /Users/davidblumenau/projects/scratch/djforge
Panel Forge /Users/davidblumenau/projects/scratch/dreamatorium - ignore that the repo is called dreamatorium
Swift Danish /Users/davidblumenau/projects/scratch/swiftdanish
a small single page website called
calendar.danishdave.com (visit that)
and I host a blog you can see at
blog.danishdave.com - visit that too

I want to make a simple portfolio / redirecting path website that showcases those websites that shows visitors to the main parent domain danishdave.com a simple page with links to those projects and a brief
description of each. It should use a swiper.js showcase similar to how its done on panel forge home page and when you click each image it takes you to that website. Each image will be 1920x1080 and 375px
(and iphone height) as preview screenshots of those homepages. Just use palceholder images for now. The swiper will use the relevant image either the desktop or the mobile one depending on the screen size
that is viewing the portfolio site.
You can gather information about each project from their readme files to do a write up of each one (the blog and calendar sites can be described briefly as well).

We will do it in laravel and use tailwind for the styling. You can install whatever you need from npm as well. Ensure that you use context7 to understand how tailwind 4 works because it has changed
significantly from tailwind 3.</code></pre>
                    </div>
                </div>

                <!-- Second Prompt -->
                <div class="space-y-4">
                    <h3 class="text-xl font-semibold text-cyan-400">Deployment Setup Prompt</h3>
                    <div class="glass rounded-xl p-6">
                            <pre class="text-xs md:text-sm text-cyan-100 font-mono leading-relaxed whitespace-pre-wrap break-words"><code>Please use my github cli tool (gh to make a new repo called portfolio (if there is already one then rename that one so that this repo becomes the portfolio one) - the repo can be public.
See this directory.  /Users/davidblumenau/projects/scratch/dreamatorium/
This is a standard laravel project, and that is a nativephp / regular laravel hybrid project.
That project (dreamatorium) is deployed to my hetzner vps in a really nice way with github actions running and compiling the app building a docker image then deploying that app to the hetzner vps, all upon pushing a tag labelled web-something. In this case, I'm happy for it to run that pipeline instead when you push something with the tag v-something eg v-1.0.1 or v-1.1.0 or v-2.0.0 etc.
I want to replicate that same set up for this current project.
You can ssh into the hetzner server by using bash and saying ssh &lt;redacted&gt;@&lt;redacted&gt;
It's a simple vps that only I use so I am fine if you need to do anything sudo on it, in which case I can give you the sudo password once you need it.
I have already made an a record to point to the server with the url swiftdanish.danishdave.com but you will still need to set up the nginx virtual host thingy.</code></pre>
                    </div>
                </div>
            </div>

            <!-- Closing Statement -->
            <div class="text-center max-w-4xl mx-auto mt-12">
                <p class="text-slate-400 text-base leading-relaxed">
                    The result... well this website obviously, but completely with a Laravel application with full CI/CD pipeline, Docker containerization, and automated deployment.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Contact Section -->
<section id="contact" class="py-20 bg-gradient-to-b from-slate-900 to-slate-950">
    <div class="container mx-auto px-4 max-w-4xl">
        <div class="text-center">
            <h2 class="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Get In Touch
            </h2>
            <p class="text-slate-300 text-lg mb-12 max-w-2xl mx-auto">
                Interested in collaborating or just want to say hi? Feel free to reach out!
            </p>

            <div class="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <!-- Email -->
                <div class="relative group flex flex-col">
                    <a href="mailto:dblumenau@gmail.com" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 w-full">
                        <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <span class="text-slate-100 font-medium">Email</span>
                    </a>
                    <!-- Tooltip -->
                    <p class="mt-2 text-slate-400 text-sm text-center leading-relaxed md:hidden">
                        I've had my gmail since it was invite only back in 2005... #hipstervibes
                    </p>
                    <div class="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-slate-800 text-slate-300 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-96 z-10 border border-slate-700">
                        I've had my gmail since it was invite only back in 2005... #hipstervibes
                        <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
                    </div>
                </div>

                <!-- GitHub with tooltip -->
                <div class="relative group flex flex-col">
                    <a href="https://github.com/dblumenau" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 w-full">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">GitHub</span>
                    </a>
                    <!-- Tooltip -->
                    <p class="mt-2 text-slate-400 text-sm text-center leading-relaxed md:hidden">
                        Mostly private repos - DM me for access
                    </p>
                    <div class="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-slate-800 text-slate-300 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-96 z-10 border border-slate-700">
                        Mostly private repos - DM me for access
                        <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
                    </div>
                </div>

                <!-- LinkedIn -->
                <div class="relative group flex flex-col">
                    <a href="https://www.linkedin.com/in/dblumenau/" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 w-full">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">LinkedIn</span>
                    </a>
                    <!-- Tooltip -->
                    <p class="mt-2 text-slate-400 text-sm text-center leading-relaxed md:hidden">
                        I am fiercely loyal to my current employer, they have helped me so much with my move to Copenhagen in both a personal and professional context, and I love working here. However I'm always open to sharing, connecting and exploring cool side projects. We can all become better developers together.
                    </p>
                    <div class="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-slate-800 text-slate-300 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-96 z-10 border border-slate-700">
                        I am fiercely loyal to my current employer, they have helped me so much with my move to Copenhagen in both a personal and professional context, and I love working here. However I'm always open to sharing, connecting and exploring cool side projects. We can all become better developers together.
                        <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
                    </div>
                </div>

                <!-- Insta -->
                <div class="relative group flex flex-col">
                    <a href="https://www.instagram.com/dblumenau" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 w-full">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">Insta</span>
                    </a>
                    <!-- Tooltip -->
                    <p class="mt-2 text-slate-400 text-sm text-center leading-relaxed md:hidden">
                        Mostly just for DM's
                    </p>
                    <div class="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-slate-800 text-slate-300 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-96 z-10 border border-slate-700">
                        Mostly just for DM's
                        <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
                    </div>
                </div>

                <!-- TikTok -->
                <div class="relative group flex flex-col">
                    <a href="https://www.tiktok.com/@dblumenau" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 w-full">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">TikTok</span>
                    </a>
                    <!-- Tooltip -->
                    <p class="mt-2 text-slate-400 text-sm text-center leading-relaxed md:hidden">
                        There will be no developer stuff on here, it's all Swiftok, dance videos, and perhaps a sprinkling of BookTok...
                    </p>
                    <div class="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-slate-800 text-slate-300 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-96 z-10 border border-slate-700">
                        There will be no developer stuff on here, it's all Swiftok, dance videos, and perhaps a sprinkling of BookTok...
                        <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
                    </div>
                </div>

                <!-- Reddit -->
                <div class="relative group flex flex-col">
                    <a href="https://www.reddit.com/user/gothika4622" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 w-full">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">Reddit</span>
                    </a>
                    <!-- Tooltip -->
                    <p class="mt-2 text-slate-400 text-sm text-center leading-relaxed md:hidden">
                        Feeling bold aren't we?
                    </p>
                    <div class="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-3 bg-slate-800 text-slate-300 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-96 z-10 border border-slate-700">
                        Feeling bold aren't we?
                        <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Footer -->
<footer class="py-8 bg-slate-950">
    <div class="container mx-auto px-4 text-center text-slate-400">
        <p>&copy; {{ date('Y') }} Danish Dave. Built with Laravel & Tailwind CSS.</p><br>
        <p class="text-xs"><span class="text-cyan-400 font-semibold">*</span>
            P.S Bonus points to you if you got the <a target="_blank" href="https://www.taylorswift.com" class="text-cyan-400 font-semibold">Swiftie</a> reference there...</p>
        <p class="text-xs"></p>

    </div>
</footer>

<!-- Image Lightbox Modal -->
<div id="lightbox" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/90 p-4" onclick="closeLightbox()">
    <button
        onclick="closeLightbox()"
        class="absolute top-4 right-4 z-10 text-white hover:text-cyan-400 transition-colors duration-200 p-2"
        aria-label="Close lightbox"
    >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
    </button>
    <img
        id="lightbox-image"
        src=""
        alt=""
        class="max-h-full max-w-full object-contain rounded-lg"
        onclick="event.stopPropagation()"
    >
</div>

<!-- Description Lightbox Modal -->
<div id="description-lightbox" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/0 p-4 transition-all duration-300" onclick="closeDescriptionLightbox()">
    <div id="description-content" class="glass rounded-2xl p-6 md:p-10 max-w-4xl w-full max-h-[90vh] overflow-y-auto transform scale-95 opacity-0 transition-all duration-300" onclick="event.stopPropagation()">
        <button
            onclick="closeDescriptionLightbox()"
            class="sticky md:absolute top-2 md:top-4 right-2 md:right-4 ml-auto flex items-center justify-center w-10 h-10 rounded-full bg-slate-800/95 md:bg-slate-800/80 backdrop-blur-md border border-slate-700/50 text-slate-300 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-200 shadow-lg hover:shadow-cyan-500/20 z-10 mb-4 md:mb-0"
            aria-label="Close description"
        >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>

        <!-- Project Image -->
        <div class="relative mb-6">
            <picture>
                <source
                    id="description-image-mobile-source"
                    media="(max-width: 768px)"
                    srcset=""
                >
                <img
                    id="description-image"
                    src=""
                    alt=""
                    class="w-full h-auto max-h-[600px] md:max-h-96 object-contain rounded-xl"
                >
            </picture>
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent rounded-xl pointer-events-none"></div>
        </div>

        <h3 id="description-title" class="text-2xl md:text-4xl font-bold text-cyan-400 mb-4 pr-8">
        </h3>

        <p id="description-text" class="text-slate-300 text-base md:text-lg leading-relaxed mb-6">
        </p>

        <a id="description-link" href="#" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105">
            <span>Visit Project</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
            </svg>
        </a>
    </div>
</div>

<script>
    // View mode state
    let currentView = localStorage.getItem('portfolioView') || 'coverflow';
    let coverflowSwiper, gridView;

    // Initialize views
    document.addEventListener('DOMContentLoaded', function () {
        coverflowSwiper = document.getElementById('swiper-coverflow');
        gridView = document.getElementById('grid-view');

        console.log('Projects swiper initialized');
        console.log('What are you doing in the dev tools of my portfolio website you sneaky tricky hobbit? :)');

        // Show the correct view based on saved preference
        if (currentView === 'grid') {
            updateUIForGrid();
            enableGridClickHandlers();
        } else {
            updateUIForCoverflow();
        }

        // Toggle button functionality
        const toggleButton = document.getElementById('view-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', function() {
                if (currentView === 'coverflow') {
                    switchToGridView();
                } else {
                    switchToCoverflowView();
                }
            });
        }

        // Active section highlighting
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.getAttribute('id');

                    // Remove active class from all links
                    navLinks.forEach(link => {
                        link.classList.remove('active-nav');
                    });

                    // Add active class to current link
                    const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
                    if (activeLink) {
                        activeLink.classList.add('active-nav');
                    }
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    });

    // UI update functions
    function updateUIForGrid() {
        const toggleText = document.getElementById('toggle-text');
        const iconCoverflow = document.getElementById('toggle-icon-coverflow');
        const iconGrid = document.getElementById('toggle-icon-grid');
        const swiperContainer = document.getElementById('swiper-container');

        // Update toggle button
        toggleText.textContent = 'Coverflow View';
        iconCoverflow.classList.remove('hidden');
        iconGrid.classList.add('hidden');

        // Change container alignment and height for grid view
        swiperContainer.classList.remove('items-center', 'justify-center', 'h-screen');
        swiperContainer.classList.add('items-start', 'min-h-screen');

        // Toggle visibility
        coverflowSwiper.classList.add('hidden');
        gridView.classList.remove('hidden');
    }

    function updateUIForCoverflow() {
        const toggleText = document.getElementById('toggle-text');
        const iconCoverflow = document.getElementById('toggle-icon-coverflow');
        const iconGrid = document.getElementById('toggle-icon-grid');
        const swiperContainer = document.getElementById('swiper-container');

        // Update toggle button
        toggleText.textContent = 'Grid View';
        iconCoverflow.classList.add('hidden');
        iconGrid.classList.remove('hidden');

        // Restore center alignment and fixed height for coverflow view
        swiperContainer.classList.remove('items-start', 'min-h-screen');
        swiperContainer.classList.add('items-center', 'justify-center', 'h-screen');

        // Toggle visibility
        coverflowSwiper.classList.remove('hidden');
        gridView.classList.add('hidden');
    }

    // View switching functions
    function switchToGridView() {
        currentView = 'grid';
        localStorage.setItem('portfolioView', 'grid');
        updateUIForGrid();
        enableGridClickHandlers();
    }

    function switchToCoverflowView() {
        currentView = 'coverflow';
        localStorage.setItem('portfolioView', 'coverflow');
        updateUIForCoverflow();
        disableGridClickHandlers();
    }

    function enableGridClickHandlers() {
        const projectCards = gridView.querySelectorAll('.project-card');
        projectCards.forEach(card => {
            card.addEventListener('click', handleGridCardClick);
        });
    }

    function disableGridClickHandlers() {
        const projectCards = gridView.querySelectorAll('.project-card');
        projectCards.forEach(card => {
            card.removeEventListener('click', handleGridCardClick);
        });
    }

    function handleGridCardClick(event) {
        event.preventDefault();
        const card = event.currentTarget;
        const projectName = card.getAttribute('data-project-name');
        const projectDescription = card.getAttribute('data-project-description');
        const projectUrl = card.getAttribute('data-project-url');
        const desktopImage = card.getAttribute('data-project-desktop-image');
        const mobileImage = card.getAttribute('data-project-mobile-image');

        openDescriptionLightbox(projectName, projectDescription, projectUrl, desktopImage, mobileImage);
    }

    // Description lightbox functions
    function openDescriptionLightbox(title, description, url, desktopImageSrc, mobileImageSrc) {
        const lightbox = document.getElementById('description-lightbox');
        const content = document.getElementById('description-content');
        const titleElement = document.getElementById('description-title');
        const textElement = document.getElementById('description-text');
        const linkElement = document.getElementById('description-link');
        const imageElement = document.getElementById('description-image');
        const mobileSourceElement = document.getElementById('description-image-mobile-source');

        titleElement.textContent = title;
        textElement.textContent = description;
        linkElement.href = url;
        imageElement.src = desktopImageSrc;
        imageElement.alt = title;
        mobileSourceElement.srcset = mobileImageSrc;

        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');

        // Trigger animation after a brief delay to ensure display changes apply first
        setTimeout(() => {
            lightbox.classList.remove('bg-black/0');
            lightbox.classList.add('bg-black/90');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);

        // Prevent body scroll when lightbox is open
        document.body.style.overflow = 'hidden';
    }

    function closeDescriptionLightbox() {
        const lightbox = document.getElementById('description-lightbox');
        const content = document.getElementById('description-content');

        // Trigger close animation
        lightbox.classList.remove('bg-black/90');
        lightbox.classList.add('bg-black/0');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');

        // Wait for animation to complete before hiding
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');

            // Restore body scroll
            document.body.style.overflow = '';
        }, 300); // Match the transition duration
    }

    // Lightbox functions
    function openLightbox(imageSrc, imageAlt) {
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightbox-image');

        lightboxImage.src = imageSrc;
        lightboxImage.alt = imageAlt;

        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');

        // Prevent body scroll when lightbox is open
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        const lightbox = document.getElementById('lightbox');

        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');

        // Restore body scroll
        document.body.style.overflow = '';
    }

    // Close lightboxes with Escape key
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeLightbox();
            closeDescriptionLightbox();
        }
    });
</script>
</body>
</html>

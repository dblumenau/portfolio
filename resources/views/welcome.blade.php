<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Portfolio of David Blumenau - Developer & Creator">
    <title>Danish Dave - Portfolio</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-slate-900 text-slate-100">
    <!-- Hero Section with Swiper -->
    <section id="projects" class="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 py-20">
        <div class="container mx-auto px-4">
            <!-- Header -->
            <div class="text-center mb-12">
                <h1 class="text-5xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
                    Danish Dave
                </h1>
                <p class="text-xl md:text-2xl text-slate-300">
                    Developer, Author, Self Appointed AI Expert
                </p>
            </div>

            <!-- Swiper Carousel -->
            <div class="relative max-w-7xl mx-auto">
                <swiper-container
                    id="projects-swiper"
                    class="w-full"
                    style="height: 600px;"
                    effect="coverflow"
                    grab-cursor="true"
                    centered-slides="true"
                    slides-per-view="auto"
                    coverflow-effect-modifier="1"
                    coverflow-effect-slide-shadows="false"
                    autoplay-delay="4000"
                    autoplay-disable-on-interaction="false"
                    loop="true"
                    navigation="true"
                    pagination="true"
                    pagination-clickable="true"
                >
                    @foreach ($projects as $project)
                    <swiper-slide style="width: 600px; max-width: 90vw;">
                        <a href="{{ $project->url }}" target="_blank" rel="noopener noreferrer" class="block h-full">
                            <div class="glass rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
                                <!-- Project Image -->
                                <div class="relative mb-6 flex-shrink-0">
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
                                            class="w-full h-64 object-cover rounded-xl"
                                        >
                                    </picture>
                                    <!-- Overlay gradient -->
                                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent rounded-xl"></div>
                                </div>

                                <!-- Project Info -->
                                <div class="flex-grow">
                                    <h3 class="text-2xl md:text-3xl font-bold text-cyan-400 mb-3">
                                        {{ $project->name }}
                                    </h3>
                                    <p class="text-slate-300 text-base md:text-lg leading-relaxed">
                                        {{ $project->description }}
                                    </p>
                                </div>

                                <!-- Visit Link Indicator -->
                                <div class="mt-6 flex items-center text-cyan-400 font-medium">
                                    <span>Visit Project</span>
                                    <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                    </svg>
                                </div>
                            </div>
                        </a>
                    </swiper-slide>
                    @endforeach
                </swiper-container>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section id="about" class="py-20 bg-slate-900">
        <div class="container mx-auto px-4 max-w-4xl">
            <div class="glass rounded-2xl p-8 md:p-12">
                <h2 class="text-4xl md:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    About Me
                </h2>
                <div class="space-y-6 text-slate-300 text-lg leading-relaxed">
                    <p>
                        Hey there! I'm David, but you might know me as Danish Dave. I'm a developer with a passion for building tools that make life more interesting and enjoyable.
                    </p>
                    <p>
                        From natural language interfaces for music control to AI-powered creative studios, I love exploring the intersection of technology and everyday experiences. Whether it's helping people learn languages through games or documenting life's adventures in Denmark, I'm all about creating things that matter.
                    </p>
                    <p>
                        I work with modern technologies like Laravel, Vue.js, Tailwind CSS, and AI APIs to bring ideas to life. Each project is an opportunity to solve real problems and learn something new.
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

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <!-- Email -->
                    <a href="mailto:dblumenau@gmail.com" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20">
                        <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <span class="text-slate-100 font-medium">Email</span>
                    </a>

                    <!-- GitHub with tooltip -->
                    <div class="relative group">
                        <a href="https://github.com/dblumenau" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 w-full">
                            <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span class="text-slate-100 font-medium">GitHub</span>
                        </a>
                        <!-- Tooltip -->
                        <div class="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 border border-slate-700">
                            Mostly private repos - DM me for access
                            <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
                        </div>
                    </div>

                    <!-- LinkedIn -->
                    <a href="https://www.linkedin.com/in/dblumenau/" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">LinkedIn</span>
                    </a>

                    <!-- Insta -->
                    <a href="https://www.instagram.com/dblumenau" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">Insta</span>
                    </a>

                    <!-- TikTok -->
                    <a href="https://www.tiktok.com/@dblumenau" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">TikTok</span>
                    </a>

                    <!-- Reddit -->
                    <a href="https://www.reddit.com/user/dblumenau" target="_blank" rel="noopener noreferrer" class="glass rounded-xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20">
                        <svg class="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                        </svg>
                        <span class="text-slate-100 font-medium">Reddit</span>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-8 bg-slate-950">
        <div class="container mx-auto px-4 text-center text-slate-400">
            <p>&copy; {{ date('Y') }} Danish Dave. Built with Laravel & Tailwind CSS.</p><br>
            <p class="text-xs">P.S I made this entire portfolio website in *one shot* using Claude Code. i.e One prompt made this (except this footer message).</p>
            <p class="text-xs"></p>

        </div>
    </footer>

    <script>
        // Initialize swiper with custom configuration
        document.addEventListener('DOMContentLoaded', function() {
            const swiper = document.getElementById('projects-swiper');
            if (swiper) {
                // Swiper is initialized via web components
                console.log('Projects swiper initialized');
                console.log('What are you doing in the dev tools of my portfolio website you sneaky tricky hobbit? :)');

            }
        });
    </script>
</body>
</html>
